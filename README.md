# Smriti AI

Smriti AI is a cognitive-therapy platform for dementia and memory care. Caregivers build a personalized memory profile for a patient, and the app turns those memories into gentle, AI-generated cognitive games — multiple choice, pattern recognition, Memory Match, Memory Sequence, and Object/Visual Recall — tailored to the patient's language, difficulty level, and personal preferences.

## Features

- **Patient profiles** — name, age, language, and personal preferences (favorite color, animal, activity, food, place) that personalize the whole experience.
- **Memory Vault** — caregivers record a patient's memories (title, content, category, optional photo) to build the material games are generated from.
- **Voice Memory** — record a spoken memory and have it transcribed and saved automatically.
- **AI-generated cognitive games** — five question types per daily session (Memory Match, Memory Sequence, Object/Visual Recall, emotional engagement, multiple choice), generated from the patient's own memories in their preferred language (English, Hindi, Bengali, Assamese).
- **Adaptive difficulty** — session difficulty adjusts based on the patient's recent performance.
- **Live UI theming** — the app's accent colors update automatically based on the patient's favorite color.
- **Caregiver dashboard** — progress tracking, memory graph, reminders, and session history.
- **Role-based access** — JWT-authenticated caregiver/doctor accounts.

## Tech stack

**Frontend:** React 19 + Vite, Tailwind CSS v4, shadcn-style UI components, lucide-react icons.

**Backend:** FastAPI + SQLAlchemy, Alembic migrations, JWT auth, OpenAI-powered game generation, SpeechRecognition + FFmpeg for voice transcription.

**Database:** PostgreSQL (or any SQLAlchemy-supported database via `DATABASE_URL`).

## Project structure

```
smriti-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (patients, memories, games, therapy sessions, voice, auth, ...)
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Game generation, adaptive difficulty, memory graph
│   │   └── utils/        # Auth, roles, security helpers
│   ├── alembic/          # Database migrations
│   ├── API.md            # Endpoint reference
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/         # Dashboard, MemoryVault, Therapy, PatientProfile, VoiceMemory, Login
    │   ├── components/ui/ # Shared UI primitives (button, card, badge, alert, progress, input)
    │   └── lib/            # Theming, shared game widgets, utilities
    └── package.json
```

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A PostgreSQL database (or another database Alembic/SQLAlchemy can talk to)
- [FFmpeg](https://ffmpeg.org/) is used for voice transcription; if it isn't on your system PATH, the backend falls back to a bundled portable binary automatically.

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `backend/.env` file (see `backend/.env.example`):

```
DATABASE_URL=postgresql://username:password@localhost:5432/smriti_ai
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=your_openai_api_key
```

Run the database migrations, then start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. See [`backend/API.md`](backend/API.md) for the full endpoint reference.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at `http://127.0.0.1:8000`.

## License

This project does not currently specify a license.
