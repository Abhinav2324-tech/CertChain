import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const outFile = path.join(process.cwd(), '..', 'evaluation', 'frontend-results.json')

test.describe('Research: responsive + load', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ]

  const routes = ['/', '/verify', '/login']

  test('viewport checks and navigation timing', async ({ page }) => {
    const responsive = []
    const loadNavigationSamples = []

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      for (const route of routes) {
        const response = await page.goto(route, {
          waitUntil: 'load',
          timeout: 45_000,
        })
        expect(response, `${route} navigation`).toBeTruthy()
        expect(response.ok(), `${route} HTTP status`).toBeTruthy()

        const timing = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation').at(-1)
          if (!nav || nav.entryType !== 'navigation') return null
          const n = /** @type {PerformanceNavigationTiming} */ (nav)
          return {
            domContentLoadedEventEnd_ms: Math.round(
              n.domContentLoadedEventEnd - n.startTime,
            ),
            loadEventEnd_ms: Math.round(n.loadEventEnd - n.startTime),
          }
        })

        const horizontalOverflowPx = await page.evaluate(() => {
          const el = document.documentElement
          return Math.round(el.scrollWidth - el.clientWidth)
        })

        responsive.push({
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          path: route,
          horizontalOverflowPx,
        })
        if (timing) {
          loadNavigationSamples.push({
            viewport: vp.name,
            path: route,
            ...timing,
          })
        }
      }
    }

    const overflows = responsive.map((r) => r.horizontalOverflowPx)
    const maxOverflow = overflows.length ? Math.max(...overflows) : 0
    const passedResponsiveNoHorizontalOverflow = responsive.every(
      (r) => r.horizontalOverflowPx <= 2,
    )

    const payload = {
      responsiveViewportChecks: responsive,
      maxHorizontalOverflowPx: maxOverflow,
      passedResponsiveNoHorizontalOverflow,
      loadNavigationSamples,
      loadTimeNote:
        'Times are PerformanceNavigationTiming (browser-reported) against vite preview production build.',
    }

    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8')
  })
})
