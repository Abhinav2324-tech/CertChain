from .routes import subjects
from .routes import verification
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine
from . import models
from sqlalchemy import inspect

from .routes import university, student, certificate

models.Base.metadata.create_all(bind=engine)

# Add columns on older databases that predate model changes (SQLite or Postgres).
inspector = inspect(engine)


def ensure_column(table_name: str, column_name: str, ddl_type: str) -> None:
    if table_name not in inspector.get_table_names():
        return
    table_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name not in table_columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type}"
            )


ensure_column("certificates", "certificate_hash", "VARCHAR")
ensure_column("students", "department", "VARCHAR")
ensure_column("students", "specialization", "VARCHAR")
ensure_column("certificates", "department", "VARCHAR")
ensure_column("certificates", "specialization", "VARCHAR")
ensure_column("certificates", "original_pdf_sha256", "VARCHAR")

app = FastAPI(
    title="CertChain Academic Credential System",
    description="Blockchain Certificate Lifecycle Management",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student.router)
app.include_router(university.router)
app.include_router(certificate.router)
app.include_router(verification.router)
app.include_router(subjects.router)

@app.get("/")
def home():
    return {"message": "CertChain Backend Running"}