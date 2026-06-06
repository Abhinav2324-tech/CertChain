from typing import Optional
from pydantic import BaseModel
VALID_GRADES = ["O", "A+", "A", "B+", "B", "C", "F"]

class UniversityCreate(BaseModel):
    name: str
    email: str
    password: str


class UniversityLogin(BaseModel):
    email: str
    password: str


class StudentCreate(BaseModel):
    name: str
    roll_number: str
    password: str
    department: str
    specialization: str


class StudentLogin(BaseModel):
    roll_number: str
    password: str


class CertificateResponse(BaseModel):
    certificate_id: str
    student_id: int
    university_id: int
    document_type: str
    semester: str
    status: str
    department: Optional[str] = None
    specialization: Optional[str] = None

class SubjectGrade(BaseModel):
    subject_code: str
    grade: str


class CertificateCreate(BaseModel):
    student_id: Optional[int] = None
    roll_number: Optional[str] = None
    university_id: Optional[int] = None
    document_type: str
    semester: str
    subjects: list[SubjectGrade]
    department: Optional[str] = None
    specialization: Optional[str] = None


class TamperEditRequest(BaseModel):
    subjects: list[SubjectGrade]