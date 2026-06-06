# CertChain Deployment Guide

Deploy in this order: **Neon (database) → Render (backend) → Vercel (frontend)**.

---

## Part 1 — Neon PostgreSQL (Database)

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. Click **New Project** → name it `certchain` → create.
3. On the project dashboard, open **Connection details**.
4. Copy the **pooled** connection string (host contains `-pooler`).
5. It looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
6. Save this — you'll use it as `CERTCHAIN_DATABASE_URL` on Render.

---

## Part 2 — Render (Backend)

1. Go to [render.com](https://render.com) and sign up (GitHub login works).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select **Abhinav2324-tech/CertChain**.
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `certchain-api` |
   | **Region** | closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | Free |

5. Scroll to **Environment Variables** → add:

   | Key | Value |
   |-----|-------|
   | `CERTCHAIN_DATABASE_URL` | your Neon pooled connection string |
   | `CERTCHAIN_PUBLIC_BASE_URL` | leave blank for now; set after frontend deploy |

6. Click **Create Web Service**.
7. Wait for deploy (~3–5 min). When live, copy your URL, e.g.:
   ```
   https://certchain-api.onrender.com
   ```
8. Test: open `https://certchain-api.onrender.com/` — you should see:
   ```json
   {"message": "CertChain Backend Running"}
   ```
9. API docs: `https://certchain-api.onrender.com/docs`

> **Note:** Free Render services sleep after ~15 min idle. First request after sleep may take 30–60 seconds.

---

## Part 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New…** → **Project**.
3. Import **Abhinav2324-tech/CertChain**.
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` (click Edit) |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://certchain-api.onrender.com` (your Render URL, no trailing slash) |

6. Click **Deploy**.
7. When done, copy your Vercel URL, e.g.:
   ```
   https://certchain.vercel.app
   ```

---

## Part 4 — Connect backend to frontend URL

1. Go back to **Render** → your `certchain-api` service → **Environment**.
2. Set:
   ```
   CERTCHAIN_PUBLIC_BASE_URL=https://certchain-api.onrender.com
   ```
   (Backend API URL — used in PDF QR codes.)
3. Click **Save Changes** → Render will redeploy.

---

## Part 5 — Verify everything works

1. Open your Vercel URL.
2. **Admin:** register at `/admin-register`, then issue a test certificate.
3. **Student:** register at `/register`, log in, view certificate.
4. **Verify:** open `/verify/{certificate-id}`.
5. Check backend health: `https://certchain-api.onrender.com/docs`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Frontend shows network errors | Check `VITE_API_BASE_URL` on Vercel matches Render URL exactly |
| 404 on page refresh (e.g. `/login`) | `frontend/vercel.json` handles SPA routing — redeploy Vercel |
| Backend won't start | Check Render logs; verify `CERTCHAIN_DATABASE_URL` is the **pooled** Neon string |
| Slow first load | Render free tier cold start — normal |
| CORS errors | Backend allows `*` origins — should work; check API URL is correct |

---

## Optional — Add live demo link to README

After deploy, add to `README.md`:

```markdown
🔗 **Live Demo:** https://your-app.vercel.app
```
