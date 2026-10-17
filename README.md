<div align="center">

# ⚡ JARVIS
### Autonomous Voice-First AI Assistant & Agentic Orchestrator
*Powered by the Nova Core Engine*

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2.60%2B-FF6F00?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20Personal-purple?style=for-the-badge)](#license)

<br />

<p align="center">
  <img src="frontend/src/assets/hero.png" alt="JARVIS Nova Core Platform" width="360" />
</p>

<p align="center">
  <strong>Jarvis</strong> is an agentic, voice-first personal AI assistant engineered for local orchestration, deep episodic memory, multi-step autonomous tool reasoning, and hardened sandbox code execution.
</p>

[Key Features](#-key-features) •
[System Architecture](#-system-architecture) •
[Tool Ecosystem](#-tool-ecosystem) •
[Sandbox Security](#-hardened-sandbox-security) •
[Quick Start](#-quick-start) •
[API Reference](#-api-endpoints) •
[Configuration](#-environment-configuration) •
[Project Structure](#-project-structure)

</div>

---

## 🌟 Key Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🎙️ Natural Voice & Audio Interface</h3>
      <ul>
        <li><strong>Bi-directional Voice Loop:</strong> Ultra-fast voice-in, voice-out workflows using Whisper STT and ElevenLabs voice cloning/synthesis (with seamless browser SpeechSynthesis fallback).</li>
        <li><strong>Holographic HUD:</strong> Dynamic audio visualizer with reactive pulsating particle core, live audio amplitude telemetry, and real-time live subtitles.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🧠 Episodic Long-Term Memory (RAG)</h3>
      <ul>
        <li><strong>Vector Storage:</strong> Built on PostgreSQL + <code>pgvector</code> using OpenAI <code>text-embedding-3-small</code> embeddings (1536 dims).</li>
        <li><strong>HNSW Indexing:</strong> Sub-millisecond cosine similarity search across conversations, user facts, and personalized preferences.</li>
        <li><strong>Interactive Teaching:</strong> Dedicated memory panel to inject explicit facts and instructions into persistent storage.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ LangGraph Multi-Tool Orchestrator</h3>
      <ul>
        <li><strong>Stateful ReAct Graph:</strong> Cyclic reasoning loops powered by Anthropic Claude (Sonnet 4.6), with dynamic context injection and automatic tool recursion.</li>
        <li><strong>Human-in-the-Loop (HITL):</strong> Sensitive operations (media playback, code execution) trigger visual UI confirmation dialogs before execution proceeds.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Zero-Trust Code Execution Sandbox</h3>
      <ul>
        <li><strong>Isolated Containers:</strong> Ephemeral Docker containers spawned per execution with <code>--network=none</code>, dropped Linux capabilities, and read-only filesystems.</li>
        <li><strong>Hard Resource Bounds:</strong> Strict CPU, memory (256MB), and execution timeout (30s) controls to ensure safe arbitrary code evaluation.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🌐 Web Intelligence & Media Integration</h3>
      <ul>
        <li><strong>Real-Time Search:</strong> Fresh factual retrieval via Tavily AI Search API.</li>
        <li><strong>Deep Web Extraction:</strong> Headless content scraping using Playwright and BeautifulSoup.</li>
        <li><strong>Entertainment Control:</strong> Spotify Web API playback and YouTube search integration.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📊 Observability & Telemetry HUD</h3>
      <ul>
        <li><strong>Comprehensive Audit Log:</strong> Every tool execution, argument payload, execution time, and status code is tracked in SQL.</li>
        <li><strong>Minimalist Cyberpunk UI:</strong> React 19 + Tailwind CSS 4 with glassmorphism, fluid audio reactive canvases, and SFX feedback.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📐 System Architecture

Jarvis decouples UI interaction, cognitive orchestration, long-term memory retrieval, and execution environments into modular, containerized services:

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend (React 19 + Vite · Port 3000)"]
        UI["Modern Cyberpunk HUD"]
        Core["Holographic Core & Visualizer"]
        Input["Voice Mic / Text Directive Console"]
        Modal["Human-in-the-Loop Confirm Modal"]
    end

    subgraph Gateway["⚡ FastAPI Backend (Port 8000)"]
        API["REST & SSE Endpoints"]
        STT["OpenAI Whisper STT"]
        TTS["ElevenLabs / Browser TTS"]
        Orch["LangGraph ReAct Orchestrator"]
    end

    subgraph DataStore["🐘 PostgreSQL + pgvector (Port 5432)"]
        MemTable[("Memories Table (HNSW Vector Index)")]
        ConvTable[("Conversations & Messages")]
        AuditTable[("Tool Execution Logs")]
    end

    subgraph Execution["🛡️ Isolated Sandbox (Docker-in-Docker)"]
        Sandbox["Ephemeral Container<br/>• --network=none<br/>• --cap-drop=ALL<br/>• --read-only<br/>• 256MB RAM / 0.5 CPU"]
    end

    subgraph ExtAPIs["🌐 External Services"]
        Claude["Anthropic Claude Sonnet"]
        Tavily["Tavily Web Search"]
        Playwright["Playwright / BS4 Scraper"]
        Spotify["Spotify / YouTube"]
    end

    Input -->|"Audio / Text"| API
    API --> STT
    STT --> Orch
    Orch <-->|"Vector Search & Store"| MemTable
    Orch <-->|"Session State"| ConvTable
    Orch <-->|"LLM Tool Binding"| Claude
    Orch -->|"Approval Required?"| Modal
    Modal -->|"User Decision"| Orch
    Orch -->|"Web Query"| Tavily
    Orch -->|"URL Scrape"| Playwright
    Orch -->|"Media Control"| Spotify
    Orch -->|"Run Python"| Sandbox
    Orch -->|"Audit Telemetry"| AuditTable
    Orch --> TTS
    TTS -->|"Audio Stream + SSE"| UI
    Orch -->|"Directive Response"| Core
```

---

## 🛠️ Tool Ecosystem

The agent dynamically plans, selects, and invokes tools through standardized JSON Schemas:

| Tool | Signature | Security / Gate | Description | Backing Provider |
| :--- | :--- | :---: | :--- | :--- |
| **`web_search`** | `query: str` | 🟢 Automatic | Real-time web search for live facts, current events, and documentation. | [Tavily AI](https://tavily.com/) |
| **`web_scrape`** | `url: str` | 🟢 Automatic | Extracts structured text from articles, web pages, and documentation. | Playwright & BeautifulSoup |
| **`play_media`** | `platform, query, action` | 🟡 **Requires Approval** | Controls Spotify playback or searches YouTube playlists. | Spotify API / YouTube API |
| **`run_code`** | `language, code` | 🟡 **Requires Approval** | Executes untrusted code inside an isolated, unprivileged container. | Docker Sandbox |
| **`remember`** | `fact: str, category: str` | 🟢 Automatic | Encodes and commits facts or preferences into long-term vector memory. | pgvector + OpenAI Embeddings |
| **`recall`** | `query: str` | 🟢 Automatic | Queries semantic vector memory using cosine distance to restore context. | pgvector + OpenAI Embeddings |

---

## 🛡️ Hardened Sandbox Security

When Jarvis executes generated code (`run_code`), it delegates to an ephemeral, isolated container designed according to defense-in-depth principles:

* **No Network Egress:** Launched with `--network=none` — prevents data exfiltration, port scanning, or malicious downloads.
* **Privilege De-escalation:** Runs as non-root user `sandbox:sandbox` (`uid=1000, gid=1000`) with `--cap-drop=ALL`.
* **Immutable Filesystem:** Root filesystem is mounted `--read-only`, restricting writes to a tightly scoped in-memory `/tmp`.
* **Resource Clamping:** Constrained to `--memory=256m`, `--cpus=0.5`, and `--pids-limit=64` to prevent fork bombs and denial-of-service.
* **Automatic Eviction:** Hard 30-second execution deadline; the container is unconditionally destroyed immediately upon termination.
* **Explicit User Gate:** The orchestrator halts execution and presents an interactive UI approval modal displaying the complete source code before the container is spawned.

---

## 🚀 Quick Start

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+ with Compose v2)
* Valid API keys for **Anthropic**, **OpenAI**, and **Tavily**

---

### Option 1: One-Click Docker Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dev4706D/Jarvis.git
   cd Jarvis
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and insert your API credentials (at minimum: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `TAVILY_API_KEY`).*

3. **Launch the entire stack:**
   ```bash
   docker-compose up --build
   ```

4. **Access the services:**
   | Component | URL | Purpose |
   | :--- | :--- | :--- |
   | **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Futuristic Voice & Chat HUD |
   | **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI Engine & Health Status |
   | **Interactive Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI Schema & Testing Console |
   | **PostgreSQL Database** | `localhost:5432` | pgvector Vector Store (`nova/nova`) |

---

### Option 2: Local Development Setup (Manual)

If you prefer running services directly on your host machine for development:

#### 1. Start Database & Sandbox
```bash
# Start PostgreSQL with pgvector in the background
docker-compose up postgres -d

# Build the sandbox execution image
docker build -t nova-sandbox:latest infra/sandbox
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies in editable mode
pip install -e ".[dev]"

# Install Playwright browser binaries
playwright install chromium

# Launch the FastAPI dev server with hot-reload
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and customize your settings:

```dotenv
# ── Core LLM & Orchestration (Required) ──
ANTHROPIC_API_KEY=sk-ant-api03-...            # Brain / Orchestrator reasoning
OPENAI_API_KEY=sk-proj-...                   # Whisper STT + text-embedding-3-small
TAVILY_API_KEY=tvly-...                      # Real-time web search

# ── Voice Synthesis (Optional) ──
ELEVENLABS_API_KEY=                          # High-fidelity TTS (falls back to Web Speech API)

# ── Media Tools (Optional) ──
SPOTIFY_CLIENT_ID=                           # Spotify Developer App Client ID
SPOTIFY_CLIENT_SECRET=                       # Spotify Developer App Client Secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/spotify/callback
YOUTUBE_API_KEY=                             # Google Cloud YouTube Data API v3

# ── Model & Vector Database Tunables ──
LLM_MODEL=claude-sonnet-4-6                  # Model identifier for LangGraph agent
EMBEDDING_MODEL=text-embedding-3-small       # Embedding model
EMBEDDING_DIMENSIONS=1536                    # Vector dimension size
DATABASE_URL=postgresql+asyncpg://nova:nova@localhost:5432/nova
DATABASE_URL_SYNC=postgresql://nova:nova@localhost:5432/nova
```

---

## 📡 API Endpoints

| Method | Path | Description | Payload / Response |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/chat` | Send a text directive to the orchestrator | `{ "message": str, "conversation_id": optional[uuid] }` |
| `POST` | `/api/chat/voice` | Upload audio recording (Multipart audio/wav/webm) | Transcribes audio via Whisper, processes, and returns TTS stream |
| `POST` | `/api/chat/confirm` | Approve or deny a gated tool invocation | `{ "conversation_id": uuid, "tool_call_id": uuid, "approved": bool }` |
| `POST` | `/api/memory/teach` | Inject explicit fact, instruction, or preference | `{ "content": str, "category": "preference" \| "fact" \| "general" }` |
| `GET` | `/api/memory/search` | Query long-term vector memory by similarity | `?q=search+terms&limit=5` |
| `GET` | `/api/conversations` | List conversation history and session summaries | Array of conversation objects |
| `GET` | `/api/conversations/{id}` | Retrieve messages and tool logs for a session | Detailed message history |
| `POST` | `/api/tts` | Convert text directly to audio stream | `{ "text": str }` → Audio Blob (`audio/mpeg`) |
| `GET` | `/api/health` | Service health status and component checks | `{ "status": "healthy", "timestamp": str }` |

---

## 📂 Project Structure

```
Jarvis/
├── docker-compose.yml          # Multi-service stack orchestration (App, DB, Sandbox)
├── .env.example                # Template for environment keys & endpoints
├── README.md                   # Project documentation & operational manual
│
├── backend/                    # FastAPI & LangGraph Core
│   ├── Dockerfile              # Backend container definition
│   ├── pyproject.toml          # Python package specification & dependencies
│   └── app/
│       ├── main.py             # FastAPI routing, middleware, SSE streams & endpoints
│       ├── config.py           # Pydantic Settings & environment validation
│       ├── database.py         # SQLAlchemy async models & database operations
│       ├── memory.py           # RAG memory manager & vector embeddings
│       ├── orchestrator.py     # LangGraph agentic loop, state graph & tool bindings
│       ├── stt.py              # OpenAI Whisper speech-to-text integration
│       ├── tts.py              # ElevenLabs voice synthesis engine
│       └── tools/              # LangChain tool implementations
│           ├── web_search.py   # Tavily search integration
│           ├── web_scrape.py   # Headless scraping via Playwright & BeautifulSoup
│           ├── play_media.py   # Spotify player control & YouTube lookup
│           ├── run_code.py     # Docker sandbox manager for safe code execution
│           └── memory_tools.py # Dynamic recall and remember tools
│
├── frontend/                   # Modern React 19 Frontend
│   ├── Dockerfile              # Frontend container with Vite server
│   ├── package.json            # Node.js dependencies & scripts
│   ├── vite.config.js          # Vite build configuration
│   ├── index.html              # HTML5 entrypoint
│   └── src/
│       ├── App.jsx             # Top-level UI controller & mode router
│       ├── index.css           # Design tokens, cosmic gradients & glassmorphism
│       ├── components/
│       │   ├── HolographicCore.jsx    # Pulsing canvas audio visualizer core
│       │   ├── RealTimeConsole.jsx    # Bottom glass command bar & mic trigger
│       │   ├── ChatWindow.jsx         # Conversation stream & tool log display
│       │   ├── LiveVoiceSubtitle.jsx  # Real-time voice transcription subtitles
│       │   ├── ConfirmDialog.jsx      # Human-in-the-loop security modal
│       │   ├── TeachPanel.jsx         # Explicit memory injection drawer
│       │   ├── TelemetryHUD.jsx       # Real-time status indicators
│       │   └── Sidebar.jsx            # Conversation session manager
│       ├── hooks/
│       │   ├── useChat.js             # Chat state management & SSE handling
│       │   └── useVoice.js            # Web Audio API analyser, recording & TTS
│       └── lib/
│           ├── api.js                 # HTTP client for backend endpoints
│           └── audioSoundFx.js        # Synthetic futuristic UI sound effects
│
└── infra/                      # Infrastructure & Security
    ├── init.sql                # PostgreSQL init script (pgvector, tables & HNSW indices)
    └── sandbox/
        ├── Dockerfile          # Hardened unprivileged sandbox container
        └── run.py              # Python runner script inside sandbox
```

---

## 🧪 Testing & Code Quality

Run tests and linters locally:

```bash
# Run backend tests with pytest
cd backend
pytest

# Run Python linter & formatter checks
ruff check app/
ruff format --check app/

# Run frontend linter
cd ../frontend
npm run lint
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License** for open-source usage, or configured for private personal deployment. See `LICENSE` for details.

<div align="center">
  <sub>Engineered with precision for autonomous intelligence and local-first sovereignty.</sub>
</div>
