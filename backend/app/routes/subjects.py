from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db

router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"]
)


@router.get("/{semester}")
def get_subjects_by_semester(semester: int, db: Session = Depends(get_db)):

    subjects = db.query(models.Subject).filter(
        models.Subject.semester == semester
    ).all()

    return subjects