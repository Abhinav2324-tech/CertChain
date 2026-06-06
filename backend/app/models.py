from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from .db import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)

    certificates = relationship("Certificate", back_populates="university")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    roll_number = Column(String, unique=True)
    password = Column(String)
    department = Column(String, nullable=True)
    specialization = Column(String, nullable=True)

    certificates = relationship("Certificate", back_populates="student")


class Certificate(Base):
    
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, unique=True)

    student_id = Column(Integer, ForeignKey("students.id"))
    university_id = Column(Integer, ForeignKey("universities.id"))

    document_type = Column(String)
    semester = Column(String)
    status = Column(String, default="active")
    department = Column(String, nullable=True)
    specialization = Column(String, nullable=True)

    sgpa = Column(Float)
    certificate_hash = Column(String, nullable=True)
    original_pdf_sha256 = Column(String, nullable=True)

    student = relationship("Student", back_populates="certificates")
    university = relationship("University", back_populates="certificates")


class CertificateLog(Base):
    __tablename__ = "certificate_logs"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String)
    action = Column(String)
    timestamp = Column(String)
    performed_by = Column(String)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, index=True)
    action = Column(String, index=True)
    timestamp = Column(String)
    details = Column(String, nullable=True)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    subject_code = Column(String, unique=True)
    subject_name = Column(String)

    credits = Column(Integer)

    semester = Column(Integer)


class CertificateSubject(Base):
    __tablename__ = "certificate_subjects"

    id = Column(Integer, primary_key=True, index=True)

    certificate_id = Column(String, ForeignKey("certificates.certificate_id"))

    subject_code = Column(String)
    subject_name = Column(String)

    credits = Column(Integer)

    grade = Column(String)


class Blockchain(Base):
    __tablename__ = "blockchain"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String, unique=True, index=True)
    certificate_hash = Column(String)
    previous_hash = Column(String)
    block_hash = Column(String, unique=True)
    timestamp = Column(String)




    