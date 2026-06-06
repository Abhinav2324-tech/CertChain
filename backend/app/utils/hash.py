import hashlib


def generate_certificate_hash(
    student_id: int,
    semester: str,
    sgpa: float,
    subjects: list,
    *,
    student_name: str = "",
    roll_number: str = "",
    university_name: str = "",
    document_type: str = "",
    department: str = "",
    specialization: str = "",
) -> str:
    """
    Build a deterministic SHA-256 hash from certificate identity + academic data.
    """
    ordered_subjects = sorted(
        subjects,
        key=lambda sub: (sub.subject_code, sub.grade, sub.credits),
    )

    subject_payload = "|".join(
        f"{sub.subject_code}:{sub.grade}:{sub.credits}" for sub in ordered_subjects
    )
    raw_payload = (
        f"{student_id}|{student_name}|{roll_number}|{university_name}|"
        f"{document_type}|{semester}|{department}|{specialization}|{sgpa:.2f}|{subject_payload}"
    )
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
