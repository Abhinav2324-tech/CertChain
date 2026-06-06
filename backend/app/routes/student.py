from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..auth import validate_password, hash_password, verify_password
from ..constants import DEPARTMENTS, SPECIALIZATIONS

router = APIRouter(
    prefix="/student",
    tags=["Student"]
)


@router.post("/register")
def register_student(data: schemas.StudentCreate, db: Session = Depends(get_db)):

    ok, msg = validate_password(data.password)

    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    existing = db.query(models.Student).filter(
        models.Student.roll_number == data.roll_number
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Student already exists")

    if data.department and data.department not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail="Invalid department")

    if data.specialization and data.specialization not in SPECIALIZATIONS:
        raise HTTPException(status_code=400, detail="Invalid specialization")

    student = models.Student(
        name=data.name,
        roll_number=data.roll_number,
        password=hash_password(data.password),
        department=data.department,
        specialization=data.specialization,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "Student registered successfully",
        "student_id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "specialization": student.specialization,
    }
@router.post("/login")
def login_student(data: schemas.StudentLogin, db: Session = Depends(get_db)):

    student = db.query(models.Student).filter(
        models.Student.roll_number == data.roll_number
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not verify_password(data.password, student.password):
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "message": "Student login successful",
        "student_id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "specialization": student.specialization,
    }
@router.get("/certificates/{student_id}")
def get_student_certificates(student_id: int, db: Session = Depends(get_db)):

    student = db.query(models.Student).filter(models.Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    certificates = db.query(models.Certificate).filter(
        models.Certificate.student_id == student_id
    ).all()

    return certificates


@router.get("/by-roll/{roll_number}")
def get_student_by_roll_number(roll_number: str, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(
        models.Student.roll_number == roll_number
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "student_id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
    }