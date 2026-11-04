# Speedy Quiz ⚡

A fast-paced quiz game with Python backend.

## Features

- Multiple subjects (General, Computer, Maths, History, Space, Science, Sports, Movies, Music)
- Timer-based questions
- Leaderboard
- Score tracking
- Streak bonuses
- User authentication

## Structure

- `index.html` - Frontend interface
- `app.js` - Frontend logic
- `style.css` - Styling
- `backend/` - Python backend
  - `main.py` - FastAPI server
  - `llm.py` - LLM integration for question generation
  - `users.py` - User management
  - `fallback_questions.json` - Fallback questions
  - `leaderboard.json` - Leaderboard data

## How to Run

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the backend:
```bash
python backend/main.py
```

3. Open `index.html` in your browser

## Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- OpenAI API key (for LLM question generation)

## License

MIT
