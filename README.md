# Deprex FastAPI Backend

FastAPI backend for the Deprex mental health platform.  
Replaces all `localStorage` and browser-side Anthropic calls with a proper server.

---

## Project Structure

```
deprex-backend/
├── app/
│   ├── main.py              # FastAPI app + CORS + router registration
│   ├── config.py            # Settings loaded from .env
│   ├── auth.py              # JWT creation + bcrypt password hashing
│   ├── models/
│   │   └── database.py      # SQLAlchemy models + async engine
│   └── routers/
│       ├── auth.py          # POST /auth/register, /auth/login, GET /auth/me
│       ├── user.py          # PUT /user/interests, PATCH /user/sub-interest
│       ├── journal.py       # POST/GET /journal/
│       ├── assessment.py    # POST /assessment/, GET /assessment/latest
│       ├── events.py        # POST/GET /relief-events, /chat-events
│       └── ai.py            # POST /ai/chat, /ai/personalise
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup

### 1. Clone and install
```bash
cd deprex-backend
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in:
# ANTHROPIC_API_KEY=sk-ant-...
# SECRET_KEY=some-long-random-string
```

### 3. Run
```bash
uvicorn app.main:app --reload --port 8000
```

The database (`deprex.db`) is created automatically on first run.  
Visit `http://localhost:8000/docs` for the interactive Swagger UI.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account → returns JWT |
| POST | `/auth/login` | Login → returns JWT |
| GET | `/auth/me` | Get current user profile |

All protected endpoints require `Authorization: Bearer <token>`.

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/user/interests` | Save interests + sub-interests after onboarding |
| PATCH | `/user/sub-interest` | Update one interest's free-text preference |

### Journal
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/journal/` | Save entry → AI sentiment analysis runs server-side |
| GET | `/journal/` | Fetch last 90 entries |

### Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assessment/` | Save PHQ-9 result |
| GET | `/assessment/latest` | Get most recent assessment |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/relief-events` | Log completed activity |
| GET | `/relief-events` | Fetch all relief events |
| POST | `/chat-events` | Log chat mood signal |
| GET | `/chat-events` | Fetch all chat events |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | Send chat messages → AI reply (API key stays server-side) |
| POST | `/ai/personalise` | Reorder resources by user's preference description |

---

## What moved from frontend to backend

| Was in frontend | Now in backend |
|----------------|---------------|
| `localStorage` user store | PostgreSQL/SQLite via SQLAlchemy |
| Plain-text passwords | bcrypt hashed |
| Anthropic API key in browser | Server-side only in `.env` |
| Sentiment analysis in browser | `/journal/` endpoint |
| AI chat `fetch` in browser | `/ai/chat` endpoint |
| Resource personalisation in browser | `/ai/personalise` endpoint |

---

## Frontend changes needed

Replace every `localStorage` read/write and direct Anthropic `fetch` in `Deprex.jsx`
with calls to these endpoints. Use the JWT returned from `/auth/login` or
`/auth/register` as a Bearer token in the `Authorization` header on all
subsequent requests.

Example:
```js
// Old
localStorage.setItem("dx_users", JSON.stringify(users));

// New
await fetch("http://localhost:8000/user/interests", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({ interests, sub_interests: subInterests }),
});
```
