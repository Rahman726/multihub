"""SQLite-backed user accounts, sessions and quiz history for the Speedy Quiz app."""

import hashlib
import os
import re
import secrets
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz.db")

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")
MIN_PASSWORD_LEN = 4
PBKDF2_ITERATIONS = 240_000


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist yet. Safe to call repeatedly."""
    with _conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt          TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token      TEXT PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS games (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL REFERENCES users(id),
                score       INTEGER NOT NULL,
                correct     INTEGER NOT NULL,
                total       INTEGER NOT NULL,
                accuracy    INTEGER NOT NULL,
                best_streak INTEGER NOT NULL,
                rank_name   TEXT NOT NULL,
                created_at  TEXT NOT NULL
            );
            """
        )


# ---------------------------------------------------------------------------
# Password hashing (PBKDF2-HMAC-SHA256, stdlib only)
# ---------------------------------------------------------------------------

def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERATIONS
    ).hex()


# ---------------------------------------------------------------------------
# Signup / login / sessions
# ---------------------------------------------------------------------------

def _validate(username: str, password: str) -> str:
    username = (username or "").strip()
    if not USERNAME_RE.match(username):
        raise ValueError("Username must be 3-20 chars: letters, numbers, underscore")
    if not password or len(password) < MIN_PASSWORD_LEN:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LEN} characters")
    return username


def signup(username: str, password: str) -> str:
    """Create a user; returns a new session token. Raises ValueError on bad input."""
    username = _validate(username, password)
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    with _conn() as conn:
        try:
            conn.execute(
                "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
                (username, password_hash, salt),
            )
        except sqlite3.IntegrityError:
            raise ValueError("That username is already taken") from None
        return _new_session(conn, username)


def login(username: str, password: str) -> str:
    """Verify credentials; returns a new session token. Raises ValueError on bad input."""
    username = _validate(username, password)
    with _conn() as conn:
        row = conn.execute(
            "SELECT id, password_hash, salt FROM users WHERE username = ?", (username,)
        ).fetchone()
    if not row or _hash_password(password, row["salt"]) != row["password_hash"]:
        raise ValueError("Incorrect username or password")
    with _conn() as conn:
        return _new_session(conn, username)


def _new_session(conn: sqlite3.Connection, username: str) -> str:
    from datetime import datetime, timezone

    token = secrets.token_hex(32)
    row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, row["id"], datetime.now(timezone.utc).isoformat()),
    )
    return token


def user_for_token(token: str | None):
    """Return the user row for a valid session token, or None."""
    if not token:
        return None
    with _conn() as conn:
        row = conn.execute(
            "SELECT u.id, u.username FROM sessions s "
            "JOIN users u ON u.id = s.user_id WHERE s.token = ?",
            (token,),
        ).fetchone()
    return {"id": row["id"], "username": row["username"]} if row else None


def logout(token: str | None) -> None:
    if token:
        with _conn() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


# ---------------------------------------------------------------------------
# Quiz history
# ---------------------------------------------------------------------------

def record_game(user_id: int, *, score: int, correct: int, total: int,
                accuracy: int, best_streak: int, rank_name: str) -> None:
    from datetime import datetime, timezone

    with _conn() as conn:
        conn.execute(
            "INSERT INTO games (user_id, score, correct, total, accuracy, "
            "best_streak, rank_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, score, correct, total, accuracy, best_streak, rank_name,
             datetime.now(timezone.utc).isoformat()),
        )


def history(user_id: int, limit: int = 10) -> dict:
    """Recent games plus lifetime aggregates for a user."""
    with _conn() as conn:
        games = [
            dict(g)
            for g in conn.execute(
                "SELECT score, correct, total, accuracy, best_streak, rank_name, "
                "created_at FROM games WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        ]
        agg = conn.execute(
            "SELECT COUNT(*) AS games_played, "
            "COALESCE(MAX(score), 0) AS best_score, "
            "COALESCE(ROUND(AVG(accuracy)), 0) AS avg_accuracy "
            "FROM games WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    return {
        "games_played": agg["games_played"],
        "best_score": agg["best_score"],
        "avg_accuracy": agg["avg_accuracy"],
        "games": games,
    }


# Initialize the database tables at import time.
init_db()
