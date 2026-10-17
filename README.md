# Nova — Personal AI Voice & Text Assistant

A local-first AI orchestrator that accepts voice or text commands, routes them through an LLM with tool-calling, executes tools, remembers interactions via RAG, and speaks responses back.

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐     ┌──────────────┐
│   Frontend   │────▶│              FastAPI Backend              │────▶│   External   │
│  React + TW  │◀────│                                          │◀────│    APIs      │
│  Port 3000   │     │  ┌──────────┐  ┌───────┐  ┌──────────┐  │     │              │
└─────────────┘     │  │ LangGraph │──│ Tools │──│ Memory   │  │     │ • Claude     │
                    │  │ Orchest.  │  │       │  │ (pgvect) │  │     │ • Whisper    │
                    │  └──────────┘  └───────┘  └──────────┘  │     │ • ElevenLabs │
                    │       Port 8000                          │     │ • Tavily     │
                    └──────────────────────────────────────────┘     │ • Spotify    │
                                        │                           │ • YouTube    │
                              ┌─────────┴─────────┐                 └──────────────┘
                              │                   │
                        ┌─────┴─────┐     ┌───────┴───────┐
                        │ PostgreSQL │     │   Sandbox     │
                        │ + pgvector │     │  (isolated)   │
                        │ Port 5432  │     │ --network=none│
                        └───────────┘     └───────────────┘
```

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- API keys (see `.env.example`)

### 1. Clone and configure
```bash
cd Jarvis
cp .env.example .env
# Edit .env and add your API keys (at minimum: ANTHROPIC_API_KEY, OPENAI_API_KEY, TAVILY_API_KEY)
```

### 2. Start everything
```bash
docker-compose up --build
```

This starts:
- **Frontend** at [http://localhost:3000](http://localhost:3000)
- **Backend API** at [http://localhost:8000](http://localhost:8000)
- **PostgreSQL** with pgvector on port 5432
- **Sandbox** image for isolated code execution

### 3. Verify
Open [http://localhost:3000](http://localhost:3000) and try:
- Type: *"Search the web for today's weather in Delhi"*
- Click the mic and say: *"Play Blinding Lights on Spotify"*
- Type: *"Remember that I prefer concise answers"*

---

## Development Setup (without Docker)

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
pip install -e ".[dev]"
playwright install chromium
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
# Start just PostgreSQL via Docker
docker-compose up postgres -d

# Or use a local PostgreSQL with pgvector installed
psql -U nova -d nova -f infra/init.sql
```

---

## Tools

| Tool | Description | API Required |
|------|-------------|-------------|
| `web_search(query)` | Real-time web search via Tavily | `TAVILY_API_KEY` |
| `web_scrape(url)` | Scrape & extract text from any URL | None |
| `play_media(platform, query, action)` | Spotify playback / YouTube search | `SPOTIFY_*` / `YOUTUBE_API_KEY` |
| `run_code(language, code)` | Execute code in isolated sandbox | Docker |
| `remember(fact, category)` | Store a fact in vector memory | `OPENAI_API_KEY` (embeddings) |
| `recall(query)` | Search past memories by similarity | `OPENAI_API_KEY` (embeddings) |

## Security Model

- **Code execution** runs in Docker with:
  - `--network=none` (no internet)
  - `--cap-drop=ALL` (no Linux capabilities)
  - `--read-only` (immutable filesystem)
  - `--user=1000:1000` (non-root)
  - `--memory=256m` / `--cpus=0.5` (resource limits)
  - 30-second timeout
  - Ephemeral container destroyed after each execution

- **Dangerous actions** (code execution, media playback) require explicit user confirmation in the UI before proceeding.

- **All tool calls** are logged to the `tool_calls` table with input, output, status, and duration for full auditability.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send text message |
| POST | `/api/chat/voice` | Upload audio for voice chat |
| POST | `/api/chat/confirm` | Approve/deny pending action |
| POST | `/api/memory/teach` | Store a fact manually |
| GET | `/api/memory/search` | Search stored memories |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Get conversation messages |
| POST | `/api/tts` | Text-to-speech |
| GET | `/api/health` | Health check |

## Project Structure

```
Jarvis/
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # API key template
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── app/
│       ├── main.py             # FastAPI routes
│       ├── config.py           # Pydantic Settings
│       ├── database.py         # SQLAlchemy models
│       ├── memory.py           # RAG / embeddings
│       ├── orchestrator.py     # LangGraph agent
│       ├── stt.py              # Whisper STT
│       ├── tts.py              # ElevenLabs TTS
│       └── tools/
│           ├── web_search.py
│           ├── web_scrape.py
│           ├── play_media.py
│           ├── run_code.py
│           └── memory_tools.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       ├── hooks/
│       └── lib/
└── infra/
    ├── init.sql
    └── sandbox/
        ├── Dockerfile
        └── run.py
```

## License

Private — for personal use only.
