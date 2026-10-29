"""One-off end-to-end verification of the Speedy Quiz API. Run: python verify_flow.py"""
import json
import random
import string
import sys

import requests

import io
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000"
BASE_PTS, SPEED_BONUS, STREAK_BONUS = 100, 50, 25

failures = []


def check(name, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {name}" + (f"  ({detail})" if detail and not cond else ""))
    if not cond:
        failures.append(name)


# 1) static frontend served
for path, expected in [("/", 200), ("/app.js", 200), ("/style.css", 200)]:
    r = requests.get(BASE + path)
    check(f"GET {path} -> {expected}", r.status_code == expected, f"got {r.status_code}")

# 2) signup + login + me
suffix = "".join(random.choices(string.ascii_lowercase, k=6))
user, pw = f"verify_{suffix}", "secret123"
sessions = []

def signup(u, p):
    r = requests.post(f"{BASE}/api/signup", json={"username": u, "password": p})
    return r

r = signup(user, pw)
check("signup works", r.status_code == 200, r.text[:200])
token = r.json().get("token")
check("signup returns token+username", bool(token) and r.json()["username"] == user)
sessions.append(token)

r = signup(user, pw)
check("duplicate signup -> 400", r.status_code == 400, r.status_code)

r = signup("ab", pw)
check("short username -> 400", r.status_code == 400, r.status_code)

r = signup(user, "x")
check("short password -> 400", r.status_code == 400, r.status_code)

r = requests.post(f"{BASE}/api/login", json={"username": user, "password": "wrongpw"})
check("wrong password login -> 400", r.status_code == 400, r.status_code)

r = requests.post(f"{BASE}/api/login", json={"username": user, "password": pw})
check("login works", r.status_code == 200, r.text[:200])
token2 = r.json().get("token")
sessions.append(token2)

r = requests.get(f"{BASE}/api/me", headers={"Authorization": f"Bearer {token}"})
check("me returns username", r.status_code == 200 and r.json()["username"] == user, r.text[:200])

r = requests.get(f"{BASE}/api/history", headers={"Authorization": "Bearer nope"})
check("bad token -> 401", r.status_code == 401, r.status_code)

# 3) quiz requires auth
r = requests.post(f"{BASE}/api/quiz", json={"topic": "space", "count": 5})
check("quiz without auth -> 401", r.status_code == 401, r.status_code)

# 4) create quiz with auth
r = requests.post(
    f"{BASE}/api/quiz",
    json={"topic": "space", "count": 5, "seconds_per_question": 20},
    headers={"Authorization": f"Bearer {token}"},
)
check("quiz with auth -> 200", r.status_code == 200, r.text[:300])
quiz = r.json()
check("quiz has source", quiz.get("source") in ("ai", "local-ai", "fallback"), quiz.get("source"))
check("quiz returns >=3 questions", len(quiz["questions"]) >= 3, len(quiz["questions"]))
check("questions contain no answer field", all("answer" not in q for q in quiz["questions"]))

quiz_id = quiz["quiz_id"]

# 5) answer errors
r = requests.post(f"{BASE}/api/answer", json={"quiz_id": "no_such", "question_id": "x", "choice": "a", "seconds_left": 5}, headers={"Authorization": f"Bearer {token}"})
check("unknown quiz -> 404", r.status_code == 404, r.status_code)
q0, q1 = quiz["questions"][0], quiz["questions"][1]
r = requests.post(f"{BASE}/api/answer", json={"quiz_id": quiz_id, "question_id": "bogus", "choice": "a", "seconds_left": 5}, headers={"Authorization": f"Bearer {token}"})
check("unknown question -> 400", r.status_code == 400, r.status_code)

# 6) scoring math when the source is the offline bank (we know the key)
source = quiz["source"]
if source == "fallback":
    bank = json.load(open("backend/fallback_questions.json", encoding="utf-8"))
    answers = {q["question"]: q["answer"] for topic, qs in bank.items() for q in qs}

    def answer(q, choice, seconds_left=15):
        return requests.post(
            f"{BASE}/api/answer",
            json={"quiz_id": quiz_id, "question_id": q["id"], "choice": choice, "seconds_left": seconds_left},
            headers={"Authorization": f"Bearer {token}"},
        ).json()

    # q0 correct at 15/20s left: 100 + round(15/20*50)=38, no streak yet
    a0 = answer(q0, answers[q0["question"]], 15)
    expect = BASE_PTS + round(15 / 20 * SPEED_BONUS)
    check("correct answer points math", a0["correct"] and a0["points"] == expect, f"got {a0['points']} want {expect}")

    # duplicate answer -> 400
    r = requests.post(f"{BASE}/api/answer", json={"quiz_id": quiz_id, "question_id": q0["id"], "choice": answers[q0["question"]], "seconds_left": 15}, headers={"Authorization": f"Bearer {token}"})
    check("duplicate answer -> 400", r.status_code == 400, r.status_code)

    # q1 correct: 100 + round(15/20*50)=38, streak 2 no bonus
    a1 = answer(q1, answers[q1["question"]], 15)
    check("streak counted, no bonus yet", a1["correct"] and a1["streak"] == 2 and a1["points"] == expect, str(a1["points"]))

    # request more questions than remaining (we have 5 total, 2 answered) -> remaining 3
    others = quiz["questions"][2:]
    bank_by_id = answers
    # answer all remaining correctly to trigger streak bonus + ensure results
    pts3 = answer(others[0], bank_by_id[others[0]["question"]], 20)  # full time -> +50 speed, +25 streak
    check("streak bonus applies at 3+", pts3["correct"] and pts3["points"] == 175, f"got {pts3['points']} want {175}")
    a4 = answer(others[1], bank_by_id[others[1]["question"]], 0)
    # streak still >= 3, so streak bonus applies again: 100 base + 0 speed + 25 streak
    check("streak bonus keeps applying while streak >= 3", a4["correct"] and a4["points"] == 125, f"got {a4['points']} want {125}")
    a5 = answer(others[2], "", 8)
    check("timeout counts as wrong", not a5["correct"] and a5["points"] == 0, str(a5["points"]))

    r = requests.get(f"{BASE}/api/results", params={"quiz_id": quiz_id}, headers={"Authorization": f"Bearer {token}"})
    res = r.json()
    check("results after finish -> 200", r.status_code == 200, r.text[:200])
    expect_score = expect + expect + 175 + 125 + 0
    check("score sums correctly", res["score"] == expect_score, f"got {res['score']} want {expect_score}")
    check("accuracy = 4/5*100", res["accuracy"] == 80 and res["correct"] == 4 and res["total"] == 5, str(res))
    check("rank correct for 80%", res["rank"] == "Sharp Brain 🧠", res["rank"])

    # 7) a DIFFERENT user cannot read this quiz's results
    suffix2 = "".join(random.choices(string.ascii_lowercase, k=6))
    other_token = requests.post(
        f"{BASE}/api/signup", json={"username": f"verify2_{suffix2}", "password": "secret123"}
    ).json()["token"]
    r = requests.get(f"{BASE}/api/results", params={"quiz_id": quiz_id}, headers={"Authorization": f"Bearer {other_token}"})
    check("other user results -> 403", r.status_code == 403, r.status_code)

    # 8) history recorded exactly once
    r = requests.get(f"{BASE}/api/history", headers={"Authorization": f"Bearer {token}"})
    hist = r.json()
    scores = [g["score"] for g in hist["games"]]
    check("history has 1 game, recorded once", hist["games_played"] == 1 and scores.count(res["score"]) == 1, str(hist["games_played"]))
    game = hist["games"][0]
    check("history row matches results", game["score"] == res["score"] and game["accuracy"] == 80 and game["best_streak"] == 4, str(game))
    check("history aggregates", hist["best_score"] == res["score"] and hist["avg_accuracy"] == 80, str(hist))
else:
    print(f"[SKIP] scoring math (source={source}, cannot reconstruct answer key; covered by generic flow)")

# 9) results before finishing
r = requests.post(f"{BASE}/api/quiz", json={"topic": "general", "count": 3}, headers={"Authorization": f"Bearer {token2}"})
quiz2 = r.json()
r = requests.get(f"{BASE}/api/results", params={"quiz_id": quiz2["quiz_id"]}, headers={"Authorization": f"Bearer {token2}"})
check("incomplete quiz results -> 400", r.status_code == 400, r.status_code)

# 10) logout invalidates token
r = requests.post(f"{BASE}/api/logout", headers={"Authorization": f"Bearer {token}"})
check("logout -> ok", r.status_code == 200, r.status_code)
r = requests.get(f"{BASE}/api/me", headers={"Authorization": f"Bearer {token}"})
check("token dead after logout -> 401", r.status_code == 401, r.status_code)

# cross-token check: a different session for same user is NOT killed by logout of token
r = requests.get(f"{BASE}/api/me", headers={"Authorization": f"Bearer {token2}"})
check("other session still valid", r.status_code == 200 and r.json()["username"] == user, r.text[:200])

print()
print("=" * 50)
if failures:
    print(f"{len(failures)} FAILURES: {failures}")
    raise SystemExit(1)
print("ALL CHECKS PASSED")
