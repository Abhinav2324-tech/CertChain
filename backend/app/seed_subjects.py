import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db import SessionLocal
from app import models

db = SessionLocal()

subjects = [

# SEM 1
("CS101","Programming Fundamentals",4,1),
("CS102","Engineering Mathematics I",4,1),
("CS103","Engineering Physics",3,1),
("CS104","Basic Electrical Engineering",3,1),
("CS105","Engineering Graphics",2,1),

# SEM 2
("CS201","Data Structures",4,2),
("CS202","Engineering Mathematics II",4,2),
("CS203","Digital Logic Design",3,2),
("CS204","Computer Organization",3,2),
("CS205","Environmental Science",2,2),

# SEM 3
("CS301","Object Oriented Programming",4,3),
("CS302","Database Management Systems",4,3),
("CS303","Operating Systems",3,3),
("CS304","Design and Analysis of Algorithms",3,3),
("CS305","Computer Networks",3,3),

# SEM 4
("CS401","Software Engineering",3,4),
("CS402","Web Technologies",3,4),
("CS403","Artificial Intelligence",3,4),
("CS404","Theory of Computation",3,4),
("CS405","Probability and Statistics",3,4),

# SEM 5
("CS501","Machine Learning",3,5),
("CS502","Distributed Systems",3,5),
("CS503","Compiler Design",3,5),
("CS504","Cyber Security",3,5),
("CS505","Mobile Application Development",3,5),

# SEM 6
("CS601","Cloud Computing",3,6),
("CS602","Internet of Things",3,6),
("CS603","Big Data Analytics",3,6),
("CS604","Information Security",3,6),
("CS605","Minor Project",6,6),

# SEM 7
("CS701","Deep Learning",3,7),
("CS702","Blockchain Technology",3,7),
("CS703","Advanced Database Systems",3,7),
("CS704","Natural Language Processing",3,7),
("CS705","Elective I",3,7),

# SEM 8
("CS801","Major Project",12,8),

]

for code,name,credits,semester in subjects:

    existing = db.query(models.Subject).filter(
        models.Subject.subject_code == code
    ).first()

    if not existing:

        subject = models.Subject(
            subject_code=code,
            subject_name=name,
            credits=credits,
            semester=semester
        )

        db.add(subject)
        print("Inserted:",code)

db.commit()

print("Subjects inserted successfully")