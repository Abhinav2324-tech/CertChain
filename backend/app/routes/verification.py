import hashlib

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..utils.hash import generate_certificate_hash
from ..utils.audit import log_action

router = APIRouter(
    prefix="/certificate",
    tags=["Verification"]
)


@router.get("/verify/{certificate_id}")
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):

    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(models.Student).filter(
        models.Student.id == certificate.student_id
    ).first()

    university = db.query(models.University).filter(
        models.University.id == certificate.university_id
    ).first()

    subjects = db.query(models.CertificateSubject).filter(
        models.CertificateSubject.certificate_id == certificate_id
    ).all()

    if certificate.status == "revoked":
        log_action(db, certificate.certificate_id, "verified", "Verification failed: revoked")
        db.commit()
        return {
            "certificate_id": certificate.certificate_id,
            "student_name": student.name,
            "university": university.name,
            "semester": certificate.semester,
            "sgpa": certificate.sgpa,
            "status": "revoked",
            "authenticity_score": 0
        }

    recalculated_hash = generate_certificate_hash(
        student_id=certificate.student_id,
        student_name=student.name if student else "",
        roll_number=student.roll_number if student else "",
        university_name=university.name if university else "",
        document_type=certificate.document_type or "",
        semester=certificate.semester,
        department=certificate.department or "",
        specialization=certificate.specialization or "",
        sgpa=certificate.sgpa,
        subjects=subjects,
    )
    is_valid = recalculated_hash == certificate.certificate_hash
    status = "valid" if is_valid else "tampered"
    authenticity_score = 100 if is_valid else 0

    log_action(
        db,
        certificate.certificate_id,
        "verified",
        f"Verification result: {status}",
    )
    db.commit()

    return {
        "certificate_id": certificate.certificate_id,
        "student_name": student.name,
        "roll_number": student.roll_number,
        "university": university.name,
        "document_type": certificate.document_type,
        "department": certificate.department,
        "specialization": certificate.specialization,
        "semester": certificate.semester,
        "sgpa": certificate.sgpa,
        "status": status,
        "authenticity_score": authenticity_score,
        "subjects": [
            {
                "subject_code": sub.subject_code,
                "subject_name": sub.subject_name,
                "credits": sub.credits,
                "grade": sub.grade,
            }
            for sub in subjects
        ],
    }


@router.post("/verify-file/{certificate_id}")
async def verify_certificate_file(
    certificate_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not certificate.original_pdf_sha256:
        raise HTTPException(
            status_code=400,
            detail="No trusted PDF fingerprint stored yet. Download official PDF once and retry.",
        )

    digest = hashlib.sha256()
    while True:
        chunk = await file.read(8192)
        if not chunk:
            break
        digest.update(chunk)
    uploaded_sha256 = digest.hexdigest()
    matches = uploaded_sha256 == certificate.original_pdf_sha256

    status = "valid-file" if matches else "tampered-file"
    log_action(
        db,
        certificate.certificate_id,
        "verified",
        f"Uploaded file verification result: {status}",
    )
    db.commit()

    return {
        "certificate_id": certificate_id,
        "uploaded_filename": file.filename,
        "uploaded_sha256": uploaded_sha256,
        "trusted_sha256": certificate.original_pdf_sha256,
        "matches_trusted_pdf": matches,
        "status": status,
    }