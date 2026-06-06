import os

# In-memory DB for tests (must run before importing the FastAPI app / engine).
os.environ["CERTCHAIN_DATABASE_URL"] = "sqlite:///:memory:"
