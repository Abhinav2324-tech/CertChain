import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool


def _normalize_database_url(url: str) -> str:
    """Neon and other providers sometimes use postgres:// instead of postgresql://."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


SQLALCHEMY_DATABASE_URL = _normalize_database_url(
    os.environ.get(
        "CERTCHAIN_DATABASE_URL",
        "sqlite:///./certchain.db",
    )
)

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

_engine_kwargs: dict = {}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
    if ":memory:" in SQLALCHEMY_DATABASE_URL:
        _engine_kwargs["poolclass"] = StaticPool
else:
    # Neon / managed Postgres: recover stale connections after idle sleep.
    _engine_kwargs["pool_pre_ping"] = True

engine = create_engine(SQLALCHEMY_DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
