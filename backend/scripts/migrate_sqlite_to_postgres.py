"""
Copy data from the local SQLite file into a Postgres database (e.g. Neon).

Usage (from backend/):
  set CERTCHAIN_DATABASE_URL=postgresql://...
  python scripts/migrate_sqlite_to_postgres.py

Optional:
  set CERTCHAIN_SQLITE_SOURCE=sqlite:///./certchain.db
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.db import _normalize_database_url

TABLES = (
    models.University,
    models.Student,
    models.Subject,
    models.Certificate,
    models.CertificateLog,
    models.AuditLog,
    models.CertificateSubject,
    models.Blockchain,
)


def main() -> None:
    target_url = _normalize_database_url(
        os.environ.get("CERTCHAIN_DATABASE_URL", "")
    )
    if not target_url or target_url.startswith("sqlite"):
        raise SystemExit(
            "Set CERTCHAIN_DATABASE_URL to your Neon Postgres connection string."
        )

    source_url = os.environ.get("CERTCHAIN_SQLITE_SOURCE", "sqlite:///./certchain.db")
    source_engine = create_engine(source_url, connect_args={"check_same_thread": False})
    target_engine = create_engine(target_url, pool_pre_ping=True)

    Source = sessionmaker(bind=source_engine)
    Target = sessionmaker(bind=target_engine)

    models.Base.metadata.create_all(bind=target_engine)

    source = Source()
    target = Target()
    try:
        for model in TABLES:
            rows = source.query(model).order_by(model.id).all()
            if not rows:
                continue
            for row in rows:
                data = {
                    column.name: getattr(row, column.name)
                    for column in model.__table__.columns
                }
                target.merge(model(**data))
            print(f"Copied {len(rows)} row(s) into {model.__tablename__}")
        target.commit()
    except Exception:
        target.rollback()
        raise
    finally:
        source.close()
        target.close()

    print("Migration finished successfully.")


if __name__ == "__main__":
    main()
