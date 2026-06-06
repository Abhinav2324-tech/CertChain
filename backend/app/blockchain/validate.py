import hashlib
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..utils.hash import generate_certificate_hash


def validate_blockchain(db: Session) -> dict[str, Any]:
    """
    Walk the blockchain in primary-key order and verify:
    - previous_hash matches the prior block's block_hash (GENESIS for the first block)
    - block_hash == SHA256(certificate_hash + previous_hash)
    - certificate_hash matches the live certificates row for the same certificate_id
    """
    blocks = (
        db.query(models.Blockchain)
        .order_by(models.Blockchain.id.asc())
        .all()
    )
    errors: list[dict[str, Any]] = []
    prev_expected = "GENESIS"

    for block in blocks:
        if block.previous_hash != prev_expected:
            errors.append(
                {
                    "block_db_id": block.id,
                    "certificate_id": block.certificate_id,
                    "issue": "previous_hash_mismatch",
                    "stored_previous_hash": block.previous_hash,
                    "expected_previous_hash": prev_expected,
                }
            )

        calc_block_hash = hashlib.sha256(
            (block.certificate_hash + block.previous_hash).encode("utf-8")
        ).hexdigest()
        if calc_block_hash != block.block_hash:
            errors.append(
                {
                    "block_db_id": block.id,
                    "certificate_id": block.certificate_id,
                    "issue": "block_hash_mismatch",
                    "recomputed": calc_block_hash,
                    "stored_block_hash": block.block_hash,
                }
            )

        cert = (
            db.query(models.Certificate)
            .filter(models.Certificate.certificate_id == block.certificate_id)
            .first()
        )
        if cert is None:
            errors.append(
                {
                    "block_db_id": block.id,
                    "certificate_id": block.certificate_id,
                    "issue": "certificate_row_missing",
                }
            )
        elif cert.certificate_hash != block.certificate_hash:
            errors.append(
                {
                    "block_db_id": block.id,
                    "certificate_id": block.certificate_id,
                    "issue": "certificate_hash_out_of_sync",
                    "blockchain_certificate_hash": block.certificate_hash,
                    "live_certificate_hash": cert.certificate_hash,
                }
            )
        elif cert.certificate_hash is not None:
            student = (
                db.query(models.Student)
                .filter(models.Student.id == cert.student_id)
                .first()
            )
            university = (
                db.query(models.University)
                .filter(models.University.id == cert.university_id)
                .first()
            )
            subjects = (
                db.query(models.CertificateSubject)
                .filter(
                    models.CertificateSubject.certificate_id == cert.certificate_id
                )
                .all()
            )
            recomputed = generate_certificate_hash(
                student_id=cert.student_id,
                student_name=student.name if student else "",
                roll_number=student.roll_number if student else "",
                university_name=university.name if university else "",
                document_type=cert.document_type or "",
                semester=cert.semester,
                department=cert.department or "",
                specialization=cert.specialization or "",
                sgpa=cert.sgpa,
                subjects=subjects,
            )
            if recomputed != cert.certificate_hash:
                errors.append(
                    {
                        "block_db_id": block.id,
                        "certificate_id": block.certificate_id,
                        "issue": "payload_tampered_or_stale_digest",
                        "stored_certificate_hash": cert.certificate_hash,
                        "recomputed_from_live_rows": recomputed,
                    }
                )

        prev_expected = block.block_hash

    return {
        "valid": len(errors) == 0,
        "block_count": len(blocks),
        "error_count": len(errors),
        "errors": errors,
    }
