# Regenerate frontend-results.json then merged evaluation/results.json
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "frontend")
npm run test:e2e:evaluation
Set-Location (Join-Path $root "backend")
python scripts/run_research_evaluation.py
Write-Host "Done. See evaluation/results.json"
