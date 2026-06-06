from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..auth import validate_password, hash_password, verify_password

router = APIRouter(
    prefix="/university",
    tags=["University"]
)


@router.post("/register")
def register_university(data: schemas.UniversityCreate, db: Session = Depends(get_db)):

    ok, msg = validate_password(data.password)

    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    existing = db.query(models.University).filter(models.University.email == data.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="University already exists")

    university = models.University(
        name=data.name,
        email=data.email,
        password=hash_password(data.password)
    )

    db.add(university)
    db.commit()
    db.refresh(university)

    return {"message": "University registered successfully"}

@router.post("/login")
def university_login(data: schemas.UniversityLogin, db: Session = Depends(get_db)):

    university = db.query(models.University).filter(
        models.University.email == data.email
    ).first()

    if not university:
        raise HTTPException(status_code=404, detail="University not found")

    if not verify_password(data.password, university.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "message": "Login successful",
        "university_id": university.id,
        "name": university.name,
        "email": university.email
    }