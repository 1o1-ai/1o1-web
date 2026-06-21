#!/usr/bin/env python3
"""Generate academy-bots.json — 165 CBSE student bots + teacher bots."""
from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path

random.seed(42)

SCHOOLS = [
    ("Don Bosco Liluah", "Howrah", "West Bengal"),
    ("St. Xaviers Collegiate School", "Kolkata", "West Bengal"),
    ("La Martiniere for Boys", "Kolkata", "West Bengal"),
    ("Delhi Public School R K Puram", "New Delhi", "Delhi"),
    ("Modern School Barakhamba Road", "New Delhi", "Delhi"),
    ("Kendriya Vidyalaya IIT Bombay", "Mumbai", "Maharashtra"),
    ("Kendriya Vidyalaya IIT Madras", "Chennai", "Tamil Nadu"),
    ("Bishop Cotton Boys School", "Bengaluru", "Karnataka"),
    ("Carmel Convent School", "Chandigarh", "Chandigarh"),
    ("Ryan International School", "Gurgaon", "Haryana"),
    ("DAV Public School Sector 14", "Gurgaon", "Haryana"),
    ("Chinmaya Vidyalaya", "Chennai", "Tamil Nadu"),
    ("Sri Kumaran Childrens Home", "Bengaluru", "Karnataka"),
    ("The Heritage School", "Kolkata", "West Bengal"),
    ("Podar International School", "Mumbai", "Maharashtra"),
    ("Army Public School", "Pune", "Maharashtra"),
    ("Vidya Mandir Senior Secondary", "Chennai", "Tamil Nadu"),
    ("Springdales School", "New Delhi", "Delhi"),
    ("National Public School Indiranagar", "Bengaluru", "Karnataka"),
    ("St. Johns High School", "Chandigarh", "Chandigarh"),
    ("Bhavan Vidyalaya", "Chandigarh", "Chandigarh"),
    ("Maharaja Agarsain Public School", "Delhi", "Delhi"),
    ("Jain International School", "Nagpur", "Maharashtra"),
    ("Kendriya Vidyalaya ASC Centre", "Bengaluru", "Karnataka"),
    ("Delhi Public School Vasant Kunj", "New Delhi", "Delhi"),
]

FIRST_M = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Advik", "Pranav", "Kabir", "Ritvik", "Aarush", "Kian", "Rohan", "Sujoy",
    "Aniket", "Dev", "Rishabh", "Kartik", "Nikhil", "Siddharth", "Varun", "Akash", "Harsh", "Yash",
    "Abhishek", "Rahul", "Sourav", "Debanjan", "Pratik", "Anirban", "Subham", "Sayan", "Indranil",
    "Debojyoti", "Arghya", "Soumya", "Mainak", "Pritam",
]
FIRST_F = [
    "Ananya", "Diya", "Myra", "Aadhya", "Sara", "Ira", "Anika", "Navya", "Kiara", "Aanya",
    "Pari", "Riya", "Saanvi", "Avni", "Ishita", "Kavya", "Priya", "Sneha", "Trisha", "Madhumita",
    "Payel", "Sohini", "Rituparna", "Debjani", "Moumita", "Shreya", "Tanvi", "Nandini", "Aditi",
    "Pallavi", "Swati", "Meera", "Lakshmi", "Divya", "Neha", "Pooja", "Anushka", "Ishani", "Smita", "Barsha",
]
LAST = [
    "Das", "Sen", "Banerjee", "Mukherjee", "Chatterjee", "Ghosh", "Roy", "Bose", "Patel", "Sharma",
    "Gupta", "Singh", "Kumar", "Reddy", "Nair", "Menon", "Iyer", "Pillai", "Joshi", "Mehta",
    "Shah", "Desai", "Kapoor", "Malhotra", "Chopra", "Verma", "Agarwal", "Rao", "Krishnan", "Narayan",
    "Pandey", "Mishra", "Tiwari", "Dubey", "Saxena", "Bhattacharya", "Ganguly", "Kar", "Halder", "Mondal",
]

TEACHERS = [
    {"id": "t_sujoy_das", "name": "Sujoy Das", "gender": "male", "subject": "mathematics",
     "school": "Don Bosco Liluah", "city": "Howrah", "state": "West Bengal", "avatar": 0},
    {"id": "t_meera_nair", "name": "Meera Nair", "gender": "female", "subject": "science",
     "school": "Kendriya Vidyalaya IIT Madras", "city": "Chennai", "state": "Tamil Nadu", "avatar": 1},
    {"id": "t_rajesh_sharma", "name": "Rajesh Sharma", "gender": "male", "subject": "mathematics",
     "school": "Delhi Public School R K Puram", "city": "New Delhi", "state": "Delhi", "avatar": 2},
    {"id": "t_anita_patel", "name": "Anita Patel", "gender": "female", "subject": "science",
     "school": "Ryan International School", "city": "Gurgaon", "state": "Haryana", "avatar": 3},
    {"id": "t_arun_iyer", "name": "Arun Iyer", "gender": "male", "subject": "mathematics",
     "school": "Chinmaya Vidyalaya", "city": "Chennai", "state": "Tamil Nadu", "avatar": 4},
    {"id": "t_priya_ghosh", "name": "Priya Ghosh", "gender": "female", "subject": "science",
     "school": "St. Xaviers Collegiate School", "city": "Kolkata", "state": "West Bengal", "avatar": 5},
    {"id": "t_vikram_reddy", "name": "Vikram Reddy", "gender": "male", "subject": "mathematics",
     "school": "Bishop Cotton Boys School", "city": "Bengaluru", "state": "Karnataka", "avatar": 6},
    {"id": "t_kavita_joshi", "name": "Kavita Joshi", "gender": "female", "subject": "science",
     "school": "Carmel Convent School", "city": "Chandigarh", "state": "Chandigarh", "avatar": 7},
    {"id": "t_amit_verma", "name": "Amit Verma", "gender": "male", "subject": "mathematics",
     "school": "Modern School Barakhamba Road", "city": "New Delhi", "state": "Delhi", "avatar": 8},
    {"id": "t_sneha_kulkarni", "name": "Sneha Kulkarni", "gender": "female", "subject": "science",
     "school": "Podar International School", "city": "Mumbai", "state": "Maharashtra", "avatar": 9},
]


def avatar_url(person: dict) -> str:
    g = "men" if person["gender"] == "male" else "women"
    idx = person.get("avatar", 0) % 99
    return f"https://randomuser.me/api/portraits/{g}/{idx}.jpg"


def main() -> None:
    students: list[dict] = []
    used: set[str] = set()
    for i in range(165):
        gender = "female" if i % 2 == 0 else "male"
        pool = FIRST_F if gender == "female" else FIRST_M
        while True:
            name = f"{random.choice(pool)} {random.choice(LAST)}"
            if name not in used:
                used.add(name)
                break
        school, city, state = random.choice(SCHOOLS)
        subject = "both" if i % 5 == 0 else ("mathematics" if i % 2 else "science")
        sid = f"s_{hashlib.md5(name.encode()).hexdigest()[:10]}"
        students.append({
            "id": sid,
            "name": name,
            "gender": gender,
            "subject": subject,
            "school": school,
            "city": city,
            "state": state,
            "avatar": i % 99,
            "isBot": True,
            "role": "student",
            "location": f"{school}, {city}, {state}",
        })

    teachers = []
    for t in TEACHERS:
        row = dict(t)
        row["isBot"] = True
        row["role"] = "teacher"
        row["location"] = f"{t['school']}, {t['city']}, {t['state']}"
        teachers.append(row)

    for p in students + teachers:
        p["photo"] = avatar_url(p)

    out = Path(__file__).resolve().parents[1] / "portal" / "data" / "academy-bots.json"
    data = {
        "version": 1,
        "totalStudents": 165,
        "totalTeachers": len(teachers),
        "teachers": teachers,
        "students": students,
    }
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {out} — {len(teachers)} teachers, {len(students)} students")


if __name__ == "__main__":
    main()
