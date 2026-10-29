import json
import os
import uuid
from datetime import datetime

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from llm import generate_questions, generate_questions_batch
import users

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

app = FastAPI(title="Speedy Quiz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Scoring rules:
#   - correct answer  = 100 base points
#   - speed bonus     = up to 50 points, based on remaining time
#   - streak bonus    = +25 once you have 3+ correct answers in a row
# ---------------------------------------------------------------------------
BASE_POINTS = 100
MAX_SPEED_BONUS = 50
STREAK_BONUS = 25

MIN_SECONDS = 5
MAX_SECONDS = 60

LEADERBOARD_FILE = os.path.join(BASE_DIR, "leaderboard.json")
LEADERBOARD_TOP = 10
LEADERBOARD_MAX_ENTRIES = 50

# In-memory quizzes so answers are checked server-side (not visible in devtools)
quizzes: dict[str, dict] = {}


class QuizRequest(BaseModel):
    topic: str = "general"
    subjects: list[str] = []  # when set: 2 questions per subject
    count: int = Field(default=10, ge=3, le=20)  # single-topic mode only
    seconds_per_question: int = Field(default=20, ge=MIN_SECONDS, le=MAX_SECONDS)

SUBJECT_QUESTIONS = 2  # questions per subject in subject-chooser mode


class AnswerRequest(BaseModel):
    quiz_id: str
    question_id: str
    choice: str = ""  # empty on timeout
    seconds_left: float = Field(ge=0)


class SaveScoreRequest(BaseModel):
    quiz_id: str
    name: str = Field(min_length=1, max_length=20)


class AuthRequest(BaseModel):
    username: str
    password: str


# ---------------------------------------------------------------------------
# Authentication. Bearer token from frontend (stored in localStorage).
# ---------------------------------------------------------------------------
def user_for_bearer(authorization: str | None = Header(default=None)):
    """Resolve the Authorization header to a user, or 401."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    account = users.user_for_token(token)
    if not account:
        raise HTTPException(status_code=401, detail="Not logged in")
    return account


@app.post("/api/signup")
def signup(req: AuthRequest):
    """Create an account; returns a session token to store on the client."""
    try:
        token = users.signup(req.username, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"token": token, "username": req.username.strip()}


@app.post("/api/login")
def login(req: AuthRequest):
    """Log in; returns a session token to store on the client."""
    try:
        token = users.login(req.username, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"token": token, "username": req.username.strip()}


@app.post("/api/logout")
def logout(authorization: str | None = Header(default=None)):
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    users.logout(token)
    return {"ok": True}


@app.get("/api/me")
def me(authorization: str | None = Header(default=None)):
    account = user_for_bearer(authorization)
    return {"username": account["username"]}


@app.get("/api/history")
def history(authorization: str | None = Header(default=None)):
    account = user_for_bearer(authorization)
    return users.history(account["id"])


@app.post("/api/quiz")
def create_quiz(req: QuizRequest, authorization: str | None = Header(default=None)):
    """Build a new quiz for the logged-in user. Questions come from AI when a Z.ai key is set."""
    account = user_for_bearer(authorization)

    # Subject-chooser mode: 2 questions per chosen subject;
    # single-topic mode (no subjects list) keeps the old `count` behaviour.
    subject_list = [s.strip()[:30] for s in req.subjects if s.strip()][:6]
    if subject_list:
        generated = generate_questions_batch(subject_list, SUBJECT_QUESTIONS)
    else:
        subject_list = [req.topic.strip()[:30] or "general"]
        generated = generate_questions(subject_list[0], req.count)
        generated["questions"] = [
            {**q, "subject": subject_list[0]} for q in generated["questions"]
        ]

    topic = subject_list[0]
    out_questions = []
    secrets_map: dict[str, str] = {}
    for i, q in enumerate(generated["questions"]):
        qid = uuid.uuid4().hex[:10]
        out_questions.append(
            {"id": qid, "question": q["question"], "options": q["options"],
             "subject": q.get("subject", subject_list[0])}
        )
        secrets_map[qid] = q["answer"]

    quiz_id = f"quiz_{uuid.uuid4().hex[:12]}"
    quizzes[quiz_id] = {
        "user_id": account["id"],
        "recorded": False,
        "answers": secrets_map,
        "question_ids": [q["id"] for q in out_questions],
        "answered_ids": [],
        "score": 0,
        "correct": 0,
        "streak": 0,
        "best_streak": 0,
        "seconds_per_question": req.seconds_per_question,
        "topic": topic,
        "subjects": subject_list,
        "total": len(out_questions),
    }
    return {
        "quiz_id": quiz_id,
        "source": generated["source"],  # "ai" or "local-ai" or "fallback"
        "seconds_per_question": req.seconds_per_question,
        "total": len(out_questions),
        "questions": out_questions,
    }


@app.post("/api/answer")
def answer(req: AnswerRequest):
    quiz = quizzes.get(req.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Unknown quiz_id")
    if req.question_id not in quiz["answers"]:
        raise HTTPException(status_code=400, detail="Unknown question_id")
    if req.question_id in quiz["answered_ids"]:
        raise HTTPException(status_code=400, detail="Question already answered")

    correct_text = quiz["answers"][req.question_id]
    is_correct = req.choice == correct_text
    points = 0

    if is_correct:
        ratio = max(0.0, min(1.0, req.seconds_left / quiz["seconds_per_question"]))
        speed_bonus = round(ratio * MAX_SPEED_BONUS)
        quiz["streak"] += 1
        streak_bonus = STREAK_BONUS if quiz["streak"] >= 3 else 0
        points = BASE_POINTS + speed_bonus + streak_bonus
        quiz["score"] += points
        quiz["correct"] += 1
        quiz["best_streak"] = max(quiz["best_streak"], quiz["streak"])
    else:
        quiz["streak"] = 0

    quiz["answered_ids"].append(req.question_id)

    return {
        "correct": is_correct,
        "correct_answer": correct_text,
        "points": points,
        "streak": quiz["streak"],
        "running_score": quiz["score"],
        "answered": len(quiz["answered_ids"]),
    }


# ---------------------------------------------------------------------------
# Leaderboard: top scores across games, persisted to leaderboard.json
# ---------------------------------------------------------------------------
def _read_leaderboard() -> list[dict]:
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    try:
        with open(LEADERBOARD_FILE, encoding="utf-8") as f:
            entries = json.load(f)
        return entries if isinstance(entries, list) else []
    except (json.JSONDecodeError, OSError):
        return []  # corrupt file -> start fresh rather than crash


def _write_leaderboard(entries: list[dict]):
    tmp = LEADERBOARD_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    os.replace(tmp, LEADERBOARD_FILE)


@app.post("/api/leaderboard")
def save_score(req: SaveScoreRequest):
    """Record a finished quiz's score on the leaderboard."""
    quiz = quizzes.get(req.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Unknown quiz_id")
    if not quiz["answered_ids"]:
        raise HTTPException(status_code=400, detail="Quiz not played yet")
    if req.quiz_id in quiz.get("saved_to_board", []):
        raise HTTPException(status_code=400, detail="Score already saved")

    name = req.name.strip()[:20]
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be empty")

    accuracy = round(quiz["correct"] / quiz["total"] * 100)
    entry = {
        "name": name,
        "score": quiz["score"],
        "correct": quiz["correct"],
        "total": quiz["total"],
        "accuracy": accuracy,
        "topic": quiz.get("topic", "general"),
        "ts": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    entries = _read_leaderboard()
    entries.append(entry)
    entries.sort(key=lambda e: e.get("score", 0), reverse=True)
    entries = entries[:LEADERBOARD_MAX_ENTRIES]
    _write_leaderboard(entries)
    quiz.setdefault("saved_to_board", []).append(req.quiz_id)

    rank = entries.index(entry) + 1  # entry is guaranteed in the top list
    return {"saved": True, "rank": rank, "leaderboard": entries[:LEADERBOARD_TOP]}


@app.get("/api/leaderboard")
def get_leaderboard():
    return {"leaderboard": _read_leaderboard()[:LEADERBOARD_TOP]}


@app.get("/api/results")
def results(quiz_id: str, authorization: str | None = Header(default=None)):
    account = user_for_bearer(authorization)
    quiz = quizzes.get(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Unknown quiz_id")
    if quiz["user_id"] != account["id"]:
        raise HTTPException(status_code=403, detail="Not your quiz")
    if len(quiz["answered_ids"]) < quiz["total"]:
        raise HTTPException(status_code=400, detail="Quiz not finished yet")

    accuracy = round(quiz["correct"] / quiz["total"] * 100)
    if quiz["correct"] == quiz["total"]:
        rank = "Quiz Master 👑"
    elif accuracy >= 70:
        rank = "Sharp Brain 🧠"
    elif accuracy >= 40:
        rank = "Good Effort 🙂"
    else:
        rank = "Keep Practicing 💪"
    if not quiz["recorded"]:
        quiz["recorded"] = True
        users.record_game(
            account["id"],
            score=quiz["score"],
            correct=quiz["correct"],
            total=quiz["total"],
            accuracy=accuracy,
            best_streak=quiz["best_streak"],
            rank_name=rank,
        )

    return {
        "score": quiz["score"],
        "correct": quiz["correct"],
        "total": quiz["total"],
        "accuracy": accuracy,
        "best_streak": quiz["best_streak"],
        "rank": rank,
    }


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
