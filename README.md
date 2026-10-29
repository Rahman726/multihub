# ⚡ Speedy Quiz

A fast-paced quiz game with a **plain HTML/CSS/JavaScript** frontend and a **Python (FastAPI)** backend. Answer before the timer runs out — the faster you answer, the more bonus points you get.

## Features

- 👋 **Welcome screen** after login, with a welcome chime and subject chooser tabs
- 🗂️ **Multi-subject quiz** — tap Computer, Computer Science, Maths, History, Space, Science, Sports, Movies, Music (or type a custom subject) and get **2 questions per subject**
- 🔊 **Sounds** (WebAudio, no files): welcome chime, ambient background music during play, last-10-second timer ticks (urgent in the last 5s), and a "choose a subject first" warning — with a 🔊/🔇 mute toggle (top-right)
- ⏱️ **Timed questions** (5–60s per question, configurable) with a live countdown bar
- 🏃 **Speed bonus** — quick answers earn up to +50 extra points
- 🔥 **Streak bonus** — +25 points once you hit 3 correct answers in a row
- 🤖 **AI-generated questions** via the Z.ai API (key) **or free local Ollama (no key)**
- 📦 **Offline fallback bank** — works with no API key, no Ollama, no internet
- 🏆 **Leaderboard** — save your score with a name, top-10 shown on the start screen, persisted to `backend/leaderboard.json`
- 🔒 **Server-side answer checking** — correct answers are never sent to the browser, so no peeking in devtools
- 📱 Responsive dark-themed UI

## Scoring

| Rule | Points |
|---|---|
| Correct answer | +100 base |
| Speed bonus | up to +50, based on time remaining |
| Streak bonus (3+ in a row) | +25 |
| Wrong answer or timeout | 0 |

Max per question: 175 (100 + 50 speed + 25 streak).

## Project structure

```
├── backend/
│   ├── main.py                  # FastAPI app: quiz sessions, scoring, static serving
│   ├── llm.py                   # Question generation: Z.ai -> local Ollama -> fallback bank
│   ├── users.py                 # Accounts, tokens, per-user game history
│   ├── fallback_questions.json  # Offline question bank, editable
│   └── leaderboard.json         # Created automatically when the first score is saved
├── frontend/
│   ├── index.html               # auth → setup → quiz → results
│   ├── style.css
│   └── app.js                   # Timer, fetching, answer + leaderboard flow
├── .env.example                 # Copy to .env for AI questions
├── requirements.txt
└── README.md
```

## Getting started

Requires **Python 3.10+**.

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) enable cloud AI question generation
#    copy .env.example to .env and paste your Z.ai API key
copy .env.example .env   # Windows (Linux/macOS: cp .env.example .env)
#    then edit .env:
#    ZAI_API_KEY=your-key-here

# 3. Run the server
cd backend
python main.py

# 4. Play
open http://localhost:8000
```

## Question sources (in priority order)

1. **Z.ai cloud AI** — used when `ZAI_API_KEY` is set in `.env`. Best quality. Get a key at [z.ai](https://z.ai).
2. **Local Ollama (free, no API key)** — used automatically when no Z.ai key is available. Requires [Ollama](https://ollama.com) installed and running (`ollama serve` / tray app). Fix the model and speed in `.env`:

   ```bash
   OLLAMA_MODEL=qwen2.5:1.5b   # fast (~15s per quiz)
   OLLAMA_TIMEOUT=120          # raise for bigger models, e.g. 240 for qwen2.5:7b
   ollama pull qwen2.5:1.5b    # one-time model download (~1 GB)
   ```

   The server-side parser tolerates sloppy small-model output (letter answers,
   line-by-line JSON, `a)` option prefixes) and shuffles options so the correct
   answer isn't always first.

3. **Offline bank** — built-in `backend/fallback_questions.json`, used if both AI sources are unavailable. Set `topic` to one of `general`, `space`, `sports`, `science`, `movies`, `music`, or edit the file to add your own questions.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quiz` | Create a quiz. Subject mode: `{subjects: [...], seconds_per_question}` → 2 questions per subject, each tagged with `subject`. Single-topic mode: `{topic, count (3–20), seconds_per_question}` |
| `POST` | `/api/answer` | Submit `{quiz_id, question_id, choice, seconds_left}` → correctness, points, score |
| `GET` | `/api/results?quiz_id=...` | Final score, accuracy, best streak, rank |
| `POST` | `/api/leaderboard` | Save a finished quiz's score: `{quiz_id, name}` → your rank + top 10 |
| `GET` | `/api/leaderboard` | Top 10 scores across all games |

Responses include a `source` field: `"ai"` (Z.ai), `"local-ai"` (Ollama + model name), or `"fallback"` (offline bank).

## How it works

1. The frontend asks the backend to build a quiz for a topic.
2. The backend picks the best available question source — Z.ai API key, otherwise local Ollama, otherwise the offline bank — validates the questions, and stores the answer key server-side.
3. Each question is shown with a countdown. Your browser reports the remaining time with your answer.
4. The backend verifies the answer and time, applies base + speed + streak bonuses, and returns feedback. The timer hitting zero auto-submits as a timeout.
5. On the result screen you can save your score to the local leaderboard. Scores are kept sorted in `backend/leaderboard.json` (top 50 kept, top 10 displayed). Each quiz can only be saved once.
