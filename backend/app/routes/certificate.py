from app.utils.grading import calculate_sgpa
from app.utils.hash import generate_certificate_hash
from app.utils.audit import log_action
from app.blockchain.ledger import add_certificate_block, rechain_from_certificate
from app.blockchain.validate import validate_blockchain
from fastapi.responses import FileResponse
import qrcode
import os
import hashlib
from datetime import datetime
from reportlab.pdfgen import canvas
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid

from .. import models, schemas
from ..db import get_db
from ..constants import DEPARTMENTS, SPECIALIZATIONS



router = APIRouter(
    prefix="/certificate",
    tags=["Certificate"]
)


def file_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


@router.post("/issue", response_model=schemas.CertificateResponse)
def issue_certificate(data: schemas.CertificateCreate, db: Session = Depends(get_db)):
    if not data.student_id and not data.roll_number:
        raise HTTPException(status_code=400, detail="student_id or roll_number is required")

    student = None
    if data.student_id:
        student = db.query(models.Student).filter(
            models.Student.id == data.student_id
        ).first()
    elif data.roll_number:
        student = db.query(models.Student).filter(
            models.Student.roll_number == data.roll_number
        ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not data.university_id:
        raise HTTPException(status_code=400, detail="university_id is required")

    university = db.query(models.University).filter(
        models.University.id == data.university_id
    ).first()

    if not university:
        raise HTTPException(status_code=404, detail="University not found")

    certificate_id = "CERT-" + uuid.uuid4().hex[:8].upper()

    resolved_department = data.department if data.department is not None else student.department
    resolved_specialization = data.specialization if data.specialization is not None else student.specialization

    if resolved_department and resolved_department not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail="Invalid department")

    if resolved_specialization and resolved_specialization not in SPECIALIZATIONS:
        raise HTTPException(status_code=400, detail="Invalid specialization")

    certificate = models.Certificate(
        certificate_id=certificate_id,
        student_id=student.id,
        university_id=data.university_id,
        document_type=data.document_type,
        semester=data.semester,
        status="active",
        department=resolved_department,
        specialization=resolved_specialization,
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    for item in data.subjects:
        subject = db.query(models.Subject).filter(
        models.Subject.subject_code == item.subject_code
        ).first()

        if not subject:
            raise HTTPException(
            status_code=404,
            detail=f"Subject {item.subject_code} not found"
        )

        cert_subject = models.CertificateSubject(
            certificate_id=certificate.certificate_id,
            subject_code=subject.subject_code,
            subject_name=subject.subject_name,
            credits=subject.credits,
            grade=item.grade
        )

        db.add(cert_subject)
        db.flush()

    db.commit()

    certificate_subjects = db.query(models.CertificateSubject).filter_by(
    certificate_id=certificate.certificate_id
    ).all()

    sgpa = calculate_sgpa(certificate_subjects)

    certificate.sgpa = sgpa
    certificate.certificate_hash = generate_certificate_hash(
        student_id=certificate.student_id,
        student_name=student.name,
        roll_number=student.roll_number,
        university_name=university.name,
        document_type=certificate.document_type or "",
        semester=certificate.semester,
        department=certificate.department or "",
        specialization=certificate.specialization or "",
        sgpa=certificate.sgpa,
        subjects=certificate_subjects,
    )
    add_certificate_block(db, certificate.certificate_id, certificate.certificate_hash)
    log_action(db, certificate.certificate_id, "issued", "Certificate issued and chained")

    db.commit()

    return certificate

@router.put("/update/{certificate_id}")
def update_certificate(certificate_id: str, data: schemas.CertificateCreate, db: Session = Depends(get_db)):

    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    resolved_student = certificate.student
    if data.student_id:
        resolved_student = db.query(models.Student).filter(
            models.Student.id == data.student_id
        ).first()
    elif data.roll_number:
        resolved_student = db.query(models.Student).filter(
            models.Student.roll_number == data.roll_number
        ).first()
    if not resolved_student:
        raise HTTPException(status_code=404, detail="Student not found")

    resolved_university_id = data.university_id if data.university_id else certificate.university_id
    university = db.query(models.University).filter(
        models.University.id == resolved_university_id
    ).first()
    if not university:
        raise HTTPException(status_code=404, detail="University not found")

    resolved_department = data.department if data.department is not None else resolved_student.department
    resolved_specialization = data.specialization if data.specialization is not None else resolved_student.specialization
    if resolved_department and resolved_department not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail="Invalid department")
    if resolved_specialization and resolved_specialization not in SPECIALIZATIONS:
        raise HTTPException(status_code=400, detail="Invalid specialization")

    if not data.subjects:
        raise HTTPException(status_code=400, detail="At least one subject is required")

    db.query(models.CertificateSubject).filter(
        models.CertificateSubject.certificate_id == certificate.certificate_id
    ).delete(synchronize_session=False)

    for item in data.subjects:
        subject = db.query(models.Subject).filter(
            models.Subject.subject_code == item.subject_code
        ).first()
        if not subject:
            raise HTTPException(
                status_code=404,
                detail=f"Subject {item.subject_code} not found"
            )
        db.add(models.CertificateSubject(
            certificate_id=certificate.certificate_id,
            subject_code=subject.subject_code,
            subject_name=subject.subject_name,
            credits=subject.credits,
            grade=item.grade
        ))
    db.flush()

    certificate.student_id = resolved_student.id
    certificate.university_id = resolved_university_id
    certificate.document_type = data.document_type
    certificate.semester = data.semester
    certificate.department = resolved_department
    certificate.specialization = resolved_specialization
    certificate.status = "updated"

    certificate_subjects = db.query(models.CertificateSubject).filter_by(
        certificate_id=certificate.certificate_id
    ).all()
    certificate.sgpa = calculate_sgpa(certificate_subjects)
    certificate.certificate_hash = generate_certificate_hash(
        student_id=certificate.student_id,
        student_name=resolved_student.name,
        roll_number=resolved_student.roll_number,
        university_name=university.name,
        document_type=certificate.document_type or "",
        semester=certificate.semester,
        department=certificate.department or "",
        specialization=certificate.specialization or "",
        sgpa=certificate.sgpa,
        subjects=certificate_subjects,
    )
    rechain_from_certificate(db, certificate.certificate_id)
    log_action(db, certificate.certificate_id, "updated", "Certificate updated")

    db.commit()
    db.refresh(certificate)

    return {
        "message": "Certificate updated successfully",
        "certificate_id": certificate.certificate_id
    }


@router.get("/details/{certificate_id}")
def get_certificate_details(certificate_id: str, db: Session = Depends(get_db)):
    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(models.Student).filter(
        models.Student.id == certificate.student_id
    ).first()
    subjects = db.query(models.CertificateSubject).filter(
        models.CertificateSubject.certificate_id == certificate_id
    ).all()

    return {
        "certificate_id": certificate.certificate_id,
        "student_id": certificate.student_id,
        "roll_number": student.roll_number if student else None,
        "university_id": certificate.university_id,
        "document_type": certificate.document_type,
        "semester": certificate.semester,
        "status": certificate.status,
        "department": certificate.department,
        "specialization": certificate.specialization,
        "sgpa": certificate.sgpa,
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
@router.put("/revoke/{certificate_id}")
def revoke_certificate(certificate_id: str, db: Session = Depends(get_db)):

    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    certificate.status = "revoked"
    log_action(db, certificate.certificate_id, "revoked", "Certificate status changed to revoked")

    db.commit()

    return {
        "message": "Certificate revoked successfully",
        "certificate_id": certificate.certificate_id
    }


@router.post("/tamper/{certificate_id}")
def tamper_certificate(certificate_id: str, db: Session = Depends(get_db)):
    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    certificate_subject = db.query(models.CertificateSubject).filter(
        models.CertificateSubject.certificate_id == certificate_id
    ).first()

    if not certificate_subject:
        raise HTTPException(status_code=404, detail="No subjects linked to this certificate")

    old_grade = certificate_subject.grade
    certificate_subject.grade = "F" if old_grade != "F" else "O"
    certificate.status = "tampered"

    log_action(
        db,
        certificate_id,
        "tampered",
        f"Grade changed for {certificate_subject.subject_code}: {old_grade} -> {certificate_subject.grade}",
    )
    db.commit()

    return {
        "message": "Certificate tampered for demo successfully",
        "certificate_id": certificate_id,
        "subject_code": certificate_subject.subject_code,
        "old_grade": old_grade,
        "new_grade": certificate_subject.grade,
    }


@router.post("/tamper-edit/{certificate_id}")
def tamper_edit_certificate(
    certificate_id: str,
    data: schemas.TamperEditRequest,
    db: Session = Depends(get_db),
):
    """
    Demo tamper mode:
    simulate post-issue unauthorized edits by changing grade rows
    without re-issuing/re-hashing the certificate.
    """
    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not data.subjects:
        raise HTTPException(status_code=400, detail="At least one subject update is required")

    changed: list[str] = []
    for item in data.subjects:
        cert_subject = db.query(models.CertificateSubject).filter(
            models.CertificateSubject.certificate_id == certificate_id,
            models.CertificateSubject.subject_code == item.subject_code,
        ).first()
        if not cert_subject:
            raise HTTPException(
                status_code=404,
                detail=f"Subject {item.subject_code} not found for this certificate",
            )
        if cert_subject.grade != item.grade:
            changed.append(f"{item.subject_code}: {cert_subject.grade} -> {item.grade}")
            cert_subject.grade = item.grade

    certificate.status = "tampered"
    details = (
        "Student-side tamper simulation applied: " + ", ".join(changed)
        if changed else
        "Student-side tamper simulation invoked with no grade changes"
    )
    log_action(db, certificate_id, "tampered", details)
    db.commit()

    return {
        "message": "Tamper simulation updated certificate rows",
        "certificate_id": certificate_id,
        "status": certificate.status,
        "changed_count": len(changed),
    }


@router.get("/blockchain/integrity")
def blockchain_integrity_report(db: Session = Depends(get_db)):
    """Full-chain integrity check for research / operations (read-only)."""
    return validate_blockchain(db)


@router.get("/audit/{certificate_id}")
def get_certificate_audit_logs(certificate_id: str, db: Session = Depends(get_db)):
    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    logs = db.query(models.AuditLog).filter(
        models.AuditLog.certificate_id == certificate_id
    ).order_by(models.AuditLog.id.asc()).all()

    return {
        "certificate_id": certificate_id,
        "logs": [
            {
                "action": log.action,
                "timestamp": log.timestamp,
                "details": log.details
            }
            for log in logs
        ]
    }
@router.get("/download/{certificate_id}")
def download_certificate(certificate_id: str, request: Request, db: Session = Depends(get_db)):

    certificate = db.query(models.Certificate).filter(
        models.Certificate.certificate_id == certificate_id
    ).first()

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(models.Student).filter(
        models.Student.id == certificate.student_id
    ).first()

    base_url = os.getenv("CERTCHAIN_PUBLIC_BASE_URL")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    verify_url = f"{base_url}/certificate/verify/{certificate_id}"

    pdf_path = f"{certificate_id}.pdf"
    if not os.path.exists(pdf_path):
        qr = qrcode.make(verify_url)
        qr_path = f"{certificate_id}_qr.png"
        qr.save(qr_path)
        watermark_path = "assets/srm_watermark.png"

        c = canvas.Canvas(pdf_path)
        c.rect(30, 30, 535, 780)

        c.drawImage(watermark_path, 200, 285, width=200, height=200, mask='auto')

        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(297.5, 818, "SRM Institute of Science and Technology")

        c.setFont("Helvetica", 11)
        c.drawCentredString(297.5, 784, "Deemed to be University")

        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(297.5, 758, "SEMESTER GRADE SHEET")

        c.setFont("Helvetica", 11)
        right_x = 285
        right_max_x = 545

        def fit_text(value: str, max_width: float) -> str:
            if c.stringWidth(value, "Helvetica", 11) <= max_width:
                return value
            suffix = "..."
            trimmed = value
            while trimmed and c.stringWidth(trimmed + suffix, "Helvetica", 11) > max_width:
                trimmed = trimmed[:-1]
            return (trimmed + suffix) if trimmed else suffix

        def wrap_text(value: str, max_width: float, max_lines: int = 2) -> list[str]:
            words = value.split()
            if not words:
                return [value]
            lines = []
            current = words[0]
            for word in words[1:]:
                candidate = f"{current} {word}"
                if c.stringWidth(candidate, "Helvetica", 11) <= max_width:
                    current = candidate
                else:
                    lines.append(current)
                    current = word
                    if len(lines) == max_lines - 1:
                        break
            remaining_words = words[len(" ".join(lines + [current]).split()):]
            if remaining_words:
                tail = current + " " + " ".join(remaining_words)
                current = fit_text(tail, max_width)
            lines.append(current)
            return lines[:max_lines]

        c.drawString(60, 720, f"Name: {student.name}")
        c.drawString(60, 705, f"Register Number: {student.roll_number}")
        c.drawString(60, 690, f"Semester: {certificate.semester}")
        c.drawString(
        right_x,
        700,
        fit_text(
            f"Department: {certificate.department or 'N/A'}",
            right_max_x - right_x,
        ),
    )
        c.drawString(60, 675, "Program: B.Tech Computer Science")
        specialization_lines = wrap_text(
        f"Specialization: {certificate.specialization or 'N/A'}",
        right_max_x - right_x,
        max_lines=2,
    )
        c.drawString(right_x, 685, specialization_lines[0])
        if len(specialization_lines) > 1:
            c.drawString(right_x, 670, specialization_lines[1])

        c.setFont("Helvetica-Bold", 11)

        table_left = 50
        table_right = 550
        table_top = 650
        header_bottom = 630
        code_col = 150
        title_col = 370
        credits_col = 440

        c.drawString(60, 640, "Course Code")
        c.drawString(160, 640, "Course Title")
        c.drawString(380, 640, "Credits")
        c.drawString(460, 640, "Grade")

        c.line(table_left, table_top, table_right, table_top)
        c.line(table_left, header_bottom, table_right, header_bottom)
        c.line(table_left, table_top, table_left, header_bottom)
        c.line(code_col, table_top, code_col, header_bottom)
        c.line(title_col, table_top, title_col, header_bottom)
        c.line(credits_col, table_top, credits_col, header_bottom)
        c.line(table_right, table_top, table_right, header_bottom)
        subjects = db.query(models.CertificateSubject).filter(
        models.CertificateSubject.certificate_id == certificate_id
    ).all()

        y = 620

        for sub in subjects:

            c.drawString(60, y, sub.subject_code)
            c.drawString(160, y, sub.subject_name)
            c.drawString(390, y, str(sub.credits))
            c.drawString(460, y, sub.grade)

            c.line(table_left, y - 5, table_right, y - 5)
            y -= 20

        table_bottom = y + 15
        c.line(table_left, header_bottom, table_left, table_bottom)
        c.line(code_col, header_bottom, code_col, table_bottom)
        c.line(title_col, header_bottom, title_col, table_bottom)
        c.line(credits_col, header_bottom, credits_col, table_bottom)
        c.line(table_right, header_bottom, table_right, table_bottom)
        c.line(table_left, table_bottom, table_right, table_bottom)

        c.setFont("Helvetica-Bold", 12)
        c.drawString(60, y - 30, f"SGPA: {certificate.sgpa}")

        c.drawString(60, y - 60, f"Certificate ID: {certificate.certificate_id}")
        c.setFont("Helvetica", 11)
        c.drawString(60, y - 75, f"Issue Date: {datetime.now().strftime('%d-%m-%Y')}")

        qr_x = 420
        qr_y = 140
        qr_size = 120
        c.drawImage(qr_path, qr_x, qr_y, width=qr_size, height=qr_size)

        c.setFont("Helvetica", 10)
        c.drawCentredString(qr_x + (qr_size / 2), 120, "Scan to Verify")

        c.setFont("Helvetica", 9)
        c.drawCentredString(300, 90, "This is a system-generated certificate")

        c.setFont("Helvetica", 10)
        c.line(60, 60, 220, 60)
        c.drawString(60, 45, "Controller of Examinations")
        c.line(380, 60, 540, 60)
        c.drawString(400, 45, "Authorized Signatory")
        c.save()

    certificate.original_pdf_sha256 = file_sha256(pdf_path)
    log_action(db, certificate.certificate_id, "downloaded", "Certificate PDF downloaded")
    db.commit()

    return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_path)