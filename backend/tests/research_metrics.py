"""
Research evaluation helpers: seed data, tamper matrix (with SAVEPOINT rollback),
timing samples, and structured JSON for evaluation/results.json.
"""

from __future__ import annotations

import os
import statistics
import time
import uuid
from typing import Any, Callable

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models
from app.blockchain.validate import validate_blockchain
from app.db import SessionLocal
from app.utils.hash import generate_certificate_hash


def _register_university_student(client: TestClient) -> tuple[int, int]:
    uid = uuid.uuid4().hex[:10]
    univ = {
        "name": f"Test University {uid}",
        "email": f"uni{uid}@test.edu",
        "password": "Testpass1!",
    }
    r = client.post("/university/register", json=univ)
    assert r.status_code == 200, r.text
    r = client.post(
        "/university/login",
        json={"email": univ["email"], "password": univ["password"]},
    )
    assert r.status_code == 200, r.text
    university_id = r.json()["university_id"]

    st = {
        "name": "Eval Student",
        "roll_number": f"ROLL{uid}",
        "password": "Testpass1!",
        "department": "NWC",
        "specialization": "NWC (Networking & Communications)",
    }
    r = client.post("/student/register", json=st)
    assert r.status_code == 200, r.text
    student_id = r.json()["student_id"]
    return university_id, student_id


def _register_second_student(client: TestClient) -> int:
    uid = uuid.uuid4().hex[:8]
    st = {
        "name": "Eval Student Two",
        "roll_number": f"ROLL2{uid}",
        "password": "Testpass1!",
        "department": "IT",
        "specialization": "Internet of Things (IoT)",
    }
    r = client.post("/student/register", json=st)
    assert r.status_code == 200, r.text
    return r.json()["student_id"]


def seed_subjects(db: Session) -> None:
    rows = [
        ("EV101", "Evaluation Course 101", 3, 1),
        ("EV102", "Evaluation Course 102", 4, 1),
        ("EV103", "Evaluation Course 103", 3, 1),
    ]
    for code, name, cred, sem in rows:
        if not db.query(models.Subject).filter(models.Subject.subject_code == code).first():
            db.add(
                models.Subject(
                    subject_code=code,
                    subject_name=name,
                    credits=cred,
                    semester=sem,
                )
            )
    db.commit()


def issue_certificate(
    client: TestClient,
    university_id: int,
    student_id: int,
    semester: str,
    grades: list[tuple[str, str]] | None = None,
) -> str:
    grades = grades or [
        ("EV101", "A"),
        ("EV102", "B+"),
        ("EV103", "O"),
    ]
    body = {
        "student_id": student_id,
        "university_id": university_id,
        "document_type": "semester_grade_sheet",
        "semester": semester,
        "subjects": [{"subject_code": c, "grade": g} for c, g in grades],
    }
    r = client.post("/certificate/issue", json=body)
    assert r.status_code == 200, r.text
    db = SessionLocal()
    try:
        row = (
            db.query(models.Certificate)
            .filter(models.Certificate.student_id == student_id)
            .order_by(models.Certificate.id.desc())
            .first()
        )
        assert row is not None
        return row.certificate_id
    finally:
        db.close()


def _verify_payload_status_no_commit(db: Session, certificate_id: str) -> str:
    """
    Same rules as /certificate/verify for payload digest, without db.commit()
    (so SAVEPOINT rollback in tamper tests stays isolated).
    """
    certificate = (
        db.query(models.Certificate)
        .filter(models.Certificate.certificate_id == certificate_id)
        .first()
    )
    if not certificate:
        return "not_found"
    if certificate.status == "revoked":
        return "revoked"
    subjects = (
        db.query(models.CertificateSubject)
        .filter(models.CertificateSubject.certificate_id == certificate_id)
        .all()
    )
    recalculated = generate_certificate_hash(
        student_id=certificate.student_id,
        semester=certificate.semester,
        sgpa=certificate.sgpa,
        subjects=subjects,
    )
    if recalculated == certificate.certificate_hash:
        return "valid"
    return "tampered"


def _run_tamper_case(
    db: Session,
    certificate_id: str,
    mutate: Callable[[Session, str], None],
    expect_status: str,
) -> dict[str, Any]:
    """Apply mutation inside SAVEPOINT; assert verify status; always rollback."""
    trans = db.begin_nested()
    try:
        mutate(db, certificate_id)
        db.flush()
        status = _verify_payload_status_no_commit(db, certificate_id)
        ok = status == expect_status
        return {
            "certificate_id": certificate_id,
            "expected_status": expect_status,
            "observed_status": status,
            "caught_as_expected": ok,
        }
    finally:
        trans.rollback()


def build_evaluation_report(
    client: TestClient,
    *,
    manual_verification_minutes: float | None = None,
    multi_certificate_count: int = 15,
    verification_timing_iterations: int = 60,
) -> dict[str, Any]:
    manual_minutes = manual_verification_minutes
    if manual_minutes is None:
        manual_minutes = float(os.environ.get("MANUAL_VERIFICATION_MINUTES", "45"))

    db = SessionLocal()
    try:
        seed_subjects(db)
        university_id, student_id = _register_university_student(client)
        student_two_id = _register_second_student(client)

        cert_ids: list[str] = []
        for i in range(multi_certificate_count):
            cid = issue_certificate(
                client,
                university_id,
                student_id,
                semester=f"Semester-{i % 6}",
                grades=[
                    ("EV101", ["O", "A", "B+"][i % 3]),
                    ("EV102", "A"),
                    ("EV103", "B+"),
                ],
            )
            cert_ids.append(cid)

        multi_verify_results: list[dict[str, str]] = []
        for cid in cert_ids:
            st = _verify_payload_status_no_commit(db, cid)
            multi_verify_results.append({"certificate_id": cid, "status": st})
        all_valid = all(r["status"] == "valid" for r in multi_verify_results)

        chain_before = validate_blockchain(db)

        times_ms: list[float] = []
        sample_id = cert_ids[0]
        for _ in range(verification_timing_iterations):
            t0 = time.perf_counter()
            r = client.get(f"/certificate/verify/{sample_id}")
            times_ms.append((time.perf_counter() - t0) * 1000)
            assert r.status_code == 200

        times_sorted = sorted(times_ms)
        p50 = times_sorted[len(times_sorted) // 2]
        p95 = times_sorted[int(len(times_sorted) * 0.95) - 1]

        extra_ids: list[str] = []
        for j in range(14):
            extra_ids.append(
                issue_certificate(
                    client,
                    university_id,
                    student_id,
                    semester=f"TAMP-{j}",
                )
            )

        def mut_sgpa(d: Session, cid: str) -> None:
            c = d.query(models.Certificate).filter_by(certificate_id=cid).first()
            assert c
            c.sgpa = 0.01

        def mut_grade(d: Session, cid: str) -> None:
            s = (
                d.query(models.CertificateSubject)
                .filter_by(certificate_id=cid)
                .filter_by(subject_code="EV101")
                .first()
            )
            assert s
            s.grade = "F"

        def mut_semester(d: Session, cid: str) -> None:
            c = d.query(models.Certificate).filter_by(certificate_id=cid).first()
            assert c
            c.semester = "Tampered-Sem"

        def mut_student_id(d: Session, cid: str) -> None:
            c = d.query(models.Certificate).filter_by(certificate_id=cid).first()
            assert c
            c.student_id = student_two_id

        def mut_stored_hash(d: Session, cid: str) -> None:
            c = d.query(models.Certificate).filter_by(certificate_id=cid).first()
            assert c
            c.certificate_hash = "0" * 64

        def mut_subject_credits(d: Session, cid: str) -> None:
            s = (
                d.query(models.CertificateSubject)
                .filter_by(certificate_id=cid)
                .first()
            )
            assert s
            s.credits = 99

        def mut_remove_subject(d: Session, cid: str) -> None:
            d.query(models.CertificateSubject).filter_by(certificate_id=cid).delete()

        def mut_document_type(d: Session, cid: str) -> None:
            c = d.query(models.Certificate).filter_by(certificate_id=cid).first()
            assert c
            c.document_type = "forged_document_type"

        def mut_block_hash(d: Session, cid: str) -> None:
            b = d.query(models.Blockchain).filter_by(certificate_id=cid).first()
            assert b
            b.block_hash = "deadbeef" * 8

        def mut_block_cert_hash(d: Session, cid: str) -> None:
            b = d.query(models.Blockchain).filter_by(certificate_id=cid).first()
            assert b
            b.certificate_hash = "cafebabe" * 8

        tamper_specs: list[tuple[str, Callable[[Session, str], None], str, str]] = [
            ("sgpa_row", mut_sgpa, "tampered", "hashed_field"),
            ("grade_row", mut_grade, "tampered", "hashed_field"),
            ("semester_row", mut_semester, "tampered", "hashed_field"),
            ("student_id_row", mut_student_id, "tampered", "hashed_field"),
            ("stored_certificate_hash", mut_stored_hash, "tampered", "hashed_field"),
            ("subject_credits", mut_subject_credits, "tampered", "hashed_field"),
            ("delete_subject_row", mut_remove_subject, "tampered", "hashed_field"),
            ("document_type_not_in_hash", mut_document_type, "valid", "not_in_hash_payload"),
            ("blockchain_block_hash", mut_block_hash, "valid", "chain_only_use_integrity_endpoint"),
            ("blockchain_certificate_hash", mut_block_cert_hash, "valid", "chain_only_use_integrity_endpoint"),
        ]

        tamper_outcomes: list[dict[str, Any]] = []
        for label, fn, expect, category in tamper_specs:
            cid = extra_ids.pop()
            if category == "chain_only_use_integrity_endpoint":
                trans = db.begin_nested()
                try:
                    fn(db, cid)
                    db.flush()
                    v_status = _verify_payload_status_no_commit(db, cid)
                    ch = validate_blockchain(db)
                    tamper_outcomes.append(
                        {
                            "case": label,
                            "category": category,
                            "verify_status": v_status,
                            "chain_valid_after_mutation": ch["valid"],
                            "expected_verify": expect,
                            "expected_chain_invalid": True,
                            "chain_invalid_as_expected": not ch["valid"],
                        }
                    )
                finally:
                    trans.rollback()
            elif category == "not_in_hash_payload":
                row = _run_tamper_case(db, cid, fn, expect)
                row["case"] = label
                row["category"] = category
                tamper_outcomes.append(row)
            else:
                row = _run_tamper_case(db, cid, fn, expect)
                row["case"] = label
                row["category"] = category
                tamper_outcomes.append(row)

        hashed_cases = [t for t in tamper_outcomes if t.get("category") == "hashed_field"]
        caught_hashed = sum(
            1 for t in hashed_cases if t.get("caught_as_expected") is True
        )
        chain_cases = [
            t for t in tamper_outcomes if t.get("category") == "chain_only_use_integrity_endpoint"
        ]
        chain_caught = sum(
            1 for t in chain_cases if t.get("chain_invalid_as_expected") is True
        )

        chain_after_rollbacks = validate_blockchain(db)

        system_median_ms = p50
        manual_ms = manual_minutes * 60_000
        speedup = manual_ms / system_median_ms if system_median_ms > 0 else None
        if speedup is not None and speedup >= 1000:
            speedup_display = int(round(speedup, -3))
        elif speedup is not None:
            speedup_display = round(speedup, 1)
        else:
            speedup_display = None

        return {
            "multiple_certificates": {
                "certificates_issued_and_verified": multi_certificate_count,
                "all_reported_valid_before_tamper_suite": all_valid,
                "per_certificate_status": multi_verify_results,
            },
            "tamper_detection": {
                "hashed_payload_cases_run": len(hashed_cases),
                "hashed_payload_cases_caught": caught_hashed,
                "hashed_payload_detection_rate": (
                    caught_hashed / len(hashed_cases) if hashed_cases else None
                ),
                "chain_only_mutation_cases_run": len(chain_cases),
                "chain_only_mutation_cases_flagged_by_integrity_check": chain_caught,
                "cases": tamper_outcomes,
                "note": (
                    "Payload tampering is detected by /certificate/verify via digest mismatch. "
                    "Fields not included in generate_certificate_hash (e.g. document_type) will "
                    "not change verify status. Blockchain row tampering is surfaced by "
                    "/certificate/blockchain/integrity."
                ),
            },
            "manual_vs_system": {
                "system_verification_sample_size": verification_timing_iterations,
                "system_verification_median_ms_http": round(p50, 3),
                "system_verification_p95_ms_http": round(p95, 3),
                "system_verification_min_ms_http": round(min(times_ms), 3),
                "system_verification_max_ms_http": round(max(times_ms), 3),
                "manual_verification_reference_minutes": manual_minutes,
                "manual_reference_source": (
                    "MANUAL_VERIFICATION_MINUTES env (default 45) — replace with your measured "
                    "registrar / email turnaround for the paper."
                ),
                "approx_speedup_times_faster_vs_manual_reference": speedup_display,
            },
            "blockchain_chain_integrity": {
                "validate_before_tamper_suite": chain_before,
                "validate_after_rolled_back_tampers": chain_after_rollbacks,
            },
            "hash_payload_fields": [
                "student_id",
                "semester",
                "sgpa",
                "subject rows: subject_code, grade, credits (sorted in hash)",
            ],
        }
    finally:
        db.close()


def merge_with_frontend(
    backend: dict[str, Any], frontend: dict[str, Any] | None
) -> dict[str, Any]:
    out = {
        "backend": backend,
    }
    if frontend is not None:
        out["frontend"] = frontend
    return out
