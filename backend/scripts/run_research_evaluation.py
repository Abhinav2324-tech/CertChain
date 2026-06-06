"""
Run full research evaluation and write ../evaluation/results.json.

Usage (from repo root or backend):
  python scripts/run_research_evaluation.py

Optional env:
  MANUAL_VERIFICATION_MINUTES — reference manual turnaround in minutes (default 45).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
EVAL_DIR = REPO / "evaluation"
FRONTEND = REPO / "frontend"
FRONTEND_RESULTS = EVAL_DIR / "frontend-results.json"


def main() -> None:
    os.environ["CERTCHAIN_DATABASE_URL"] = "sqlite:///:memory:"
    sys.path.insert(0, str(BACKEND))

    from fastapi.testclient import TestClient

    # Import app only after env + path
    from app.main import app
    from tests.research_metrics import build_evaluation_report, merge_with_frontend

    client = TestClient(app)
    backend_report = build_evaluation_report(client)

    frontend_report = None
    if FRONTEND_RESULTS.is_file():
        try:
            frontend_report = json.loads(FRONTEND_RESULTS.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            frontend_report = {"error": "invalid frontend-results.json"}

    merged = merge_with_frontend(backend_report, frontend_report)
    merged["generated_at_utc"] = datetime.now(timezone.utc).isoformat()

    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    out_path = EVAL_DIR / "results.json"
    out_path.write_text(json.dumps(merged, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
