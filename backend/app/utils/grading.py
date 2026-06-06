GRADE_POINTS = {
    "O": 10,
    "A+": 9,
    "A": 8,
    "B+": 7,
    "B": 6,
    "C": 5,
    "F": 0
}
def calculate_sgpa(subjects):

    total_points = 0
    total_credits = 0

    for sub in subjects:

        grade = sub.grade
        credits = sub.credits

        grade_point = GRADE_POINTS.get(grade, 0)

        total_points += credits * grade_point
        total_credits += credits

    if total_credits == 0:
        return 0

    sgpa = total_points / total_credits

    return round(sgpa, 2)