# 🧠 HCP CRM AI — AI-First CRM for Healthcare Professionals

An intelligent CRM platform that uses **Agentic AI** to automatically extract structured interaction data from natural language conversations. Built for pharmaceutical sales representatives who log HCP (Healthcare Professional) visits.

> **Instead of manually filling 10+ form fields after every doctor visit, simply tell the AI what happened — it does the rest.**

---

## 📸 Preview

| Interaction Summary (Editable Form) | AI Chat Assistant |
|-------------------------------------|-------------------|
| Premium glassmorphism cards with native date/time pickers, live text inputs, and sentiment radio buttons | Monochrome chat interface powered by Llama 3.3 70B via Groq with real-time form synchronization |

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Natural Language Data Entry** | Tell the AI "I met Dr. Sarah at 12:45 today to discuss kidney disease" — it extracts HCP name, date, time, topics, and sentiment automatically |
| **Real-Time Form Sync** | AI updates populate a live editable form instantly via Redux state management |
| **Human-in-the-Loop** | Every AI-extracted field is manually editable. The human always has final control |
| **HCP Insights** | The AI looks up past interaction history to provide context (e.g., "Dr. Sarah rejected on price in 2 of her last 3 visits") |
| **Database Persistence** | All interactions are saved to PostgreSQL with full audit trails |
| **Smart Formatting** | Dates and times are auto-converted to browser-compatible formats regardless of how the user states them |
| **Premium Dark UI** | Glassmorphism design with Inter font, Framer Motion animations, and monochrome chat theme |

---

## 🏗️ Architecture Overview

```
┌──────────────────────┐     POST /chat      ┌─────────────────────┐
│     REACT FRONTEND   │ ──────────────────► │   FASTAPI BACKEND   │
│                      │                      │                     │
│  ┌────────┐ ┌──────┐│     JSON response    │  ┌───────────────┐  │
│  │Editable│ │ Chat ││ ◄────────────────── │  │  LangGraph    │  │
│  │ Form   │ │ Panel││                      │  │  Agent        │  │
│  └───┬────┘ └──┬───┘│                      │  │  (7 Tools)    │  │
│      │         │     │                      │  └───────┬───────┘  │
│      ▼         ▼     │                      │          │          │
│  ┌───────────────┐   │                      │          ▼          │
│  │  Redux Store  │   │                      │  ┌───────────────┐  │
│  │ (Single Source│   │                      │  │  Groq LLM     │  │
│  │  of Truth)    │   │                      │  │  Llama 3.3    │  │
│  └───────────────┘   │                      │  │  70B          │  │
└──────────────────────┘                      │  └───────────────┘  │
                                              │          │          │
                                              │          ▼          │
                                              │  ┌───────────────┐  │
                                              │  │  PostgreSQL   │  │
                                              │  │  (Docker)     │  │
                                              │  └───────────────┘  │
                                              └─────────────────────┘
```

The AI doesn't just chat — it **acts**. It calls Python functions (tools) to search the database, update form fields, pull HCP history, and save records. This is an **Agentic Architecture** powered by LangGraph's stateful graph.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | Component-based UI framework |
| Vite 8 | Lightning-fast build tool and dev server |
| Redux Toolkit | Global state management for bidirectional AI ↔ Form sync |
| TypeScript | Static type safety across the frontend |
| Framer Motion | Micro-animations and smooth transitions |
| Axios | HTTP client for backend communication |
| Lucide React | Lightweight SVG icon library |
| Vanilla CSS | Custom glassmorphism design system with CSS variables |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async Python web framework with automatic OpenAPI docs |
| LangGraph | Stateful agent orchestration with tool-calling loops |
| LangChain | LLM integration framework (messages, tools, prompts) |
| Groq (Llama 3.3 70B) | Ultra-low-latency LLM inference via custom LPU hardware |
| SQLAlchemy | ORM for type-safe PostgreSQL access |
| Pydantic | Data validation and serialization |
| PostgreSQL 15 | Relational database (Dockerized) |
| python-dateutil | Robust date/time parsing for format normalization |

---

## 📂 Project Structure

```
hcp-crm-ai/
├── backend/
│   ├── __init__.py           # Python package marker
│   ├── main.py               # FastAPI app — /chat and /hcps endpoints
│   ├── agent.py              # LangGraph state machine, 7 AI tools, LLM config
│   ├── database.py           # SQLAlchemy models (HCP, Interaction), DB init + seed
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (GROQ_API_KEY, DATABASE_URL)
│
├── frontend/
│   ├── src/
│   │   ├── store/
│   │   │   ├── index.ts              # Redux store configuration
│   │   │   └── interactionSlice.ts   # InteractionState shape, reducers, actions
│   │   ├── components/
│   │   │   └── LogInteraction/
│   │   │       ├── LogInteractionScreen.tsx  # Main layout (2/3 form + 1/3 chat)
│   │   │       ├── StructuredForm.tsx        # Editable form with pickers & radios
│   │   │       └── ChatAssistant.tsx         # AI chat panel with message history
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Complete design system (variables, utilities, glass)
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml        # PostgreSQL container configuration
├── ARCHITECTURE.md           # Detailed system architecture documentation
├── DEMO_GUIDE.md             # Demo script with code walkthrough & Q&A
├── QMS_DOMAIN_GUIDE.md       # Life Sciences QMS domain knowledge
└── README.md                 # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18+ | `node -v` |
| Python | 3.10+ | `python3 --version` |
| Docker | 24+ | `docker -v` |
| Groq API Key | — | [Get one free at console.groq.com](https://console.groq.com) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/hcp-crm-ai.git
cd hcp-crm-ai
```

### Step 2: Start the Database

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 container with:
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `hcp_crm`
- **Port**: `5432`

Verify it's running:
```bash
docker ps
# Should show: hcp-crm-db ... Up ... 0.0.0.0:5432->5432/tcp
```

### Step 3: Set Up the Backend

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt
pip install python-dateutil

# Configure environment variables
# Edit .env and replace with your own Groq API key:
#   GROQ_API_KEY=your_groq_api_key_here
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/hcp_crm

# Start the FastAPI server (run from the project root)
cd ..
uvicorn backend.main:app --port 8000 --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Set Up the Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v8.x.x  ready in XXXms
➜  Local:   http://localhost:5173/
```

### Step 5: Open the App

Navigate to **http://localhost:5173** in your browser. You should see the dual-panel interface with the Interaction Summary on the left and the AI Assistant on the right.

---

## 💬 Usage

### Talking to the AI

Type natural language messages describing your HCP interaction:

```
I met Dr. Sarah at her clinic today around 12:45 PM.
We discussed the new cardiovascular study results.
She was interested but had concerns about pricing.
I gave her 3 samples of Cardiostat and left a brochure.
```

The AI will automatically:
1. **Search** the database for Dr. Sarah and find her full record
2. **Extract** the date, time, interaction type, topics, and sentiment
3. **Format** values for browser-native pickers (dates → `YYYY-MM-DD`, times → `HH:MM`)
4. **Update** every form field in real time

### Manual Editing

Click any field in the Interaction Summary to edit it manually. Your changes are immediately synced with the AI's context.

### Saving to Database

Click the **"Log Interaction"** button to persist the validated data to PostgreSQL. You can verify the record in DBeaver or any PostgreSQL client.

---

## 🤖 AI Tools

The agent has access to 7 specialized tools:

| Tool | Purpose |
|------|---------|
| `search_hcp` | Look up an HCP in the database by name |
| `edit_interaction` | Update any form field with auto date/time formatting |
| `add_materials` | Record promotional materials shared |
| `create_followup` | Schedule a follow-up task |
| `get_hcp_insights` | Pull past interaction history and behavioral patterns |
| `summarize_interaction` | Generate a professional summary for Key Outcomes |
| `log_interaction` | Persist the final record to PostgreSQL |

---

## 🗄️ Database Schema

### `hcps` — Healthcare Professionals
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing primary key |
| name | String | Full name (e.g., "Dr. Sarah Smith") |
| specialty | String | Medical specialty (e.g., "Cardiology") |
| organization | String | Hospital or clinic name |
| location | String | City or region |

### `interactions` — Logged Visits
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Auto-incrementing primary key |
| hcp_id | Integer (FK) | References `hcps.id` |
| date | String | Visit date (YYYY-MM-DD) |
| time | String | Visit time (HH:MM) |
| interaction_type | String | Meeting, Discussion, Lunch, etc. |
| attendees | Text | People present during the interaction |
| topics_discussed | Text | Key discussion points |
| materials_shared | Text | Brochures, studies, or collateral shared |
| samples_distributed | Text | Medication samples given |
| sentiment | String | positive, neutral, or negative |
| outcomes | Text | Key outcomes and follow-up actions |
| created_at | DateTime | Timestamp of record creation |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/hcps` | Returns all HCPs in the database |
| `POST` | `/chat` | Sends a message to the AI agent |
| `GET` | `/docs` | FastAPI auto-generated Swagger documentation |

### POST `/chat` — Request Body
```json
{
  "message": "I met Dr. Sarah at 12:45 today",
  "thread_id": "default-session",
  "interaction_state": {
    "hcp_name": "",
    "interaction_type": "",
    "date": "",
    "time": "",
    "attendees": "",
    "topics_discussed": "",
    "materials_shared": "",
    "samples_distributed": "",
    "sentiment": "neutral",
    "outcomes": ""
  }
}
```

### POST `/chat` — Response
```json
{
  "reply": "I've logged your meeting with Dr. Sarah Smith...",
  "tool_calls": [...],
  "updated_interaction": {
    "hcp_name": "Dr. Sarah Smith",
    "date": "2026-04-18",
    "time": "12:45",
    "interaction_type": "Discussion",
    ...
  }
}
```

---

## ⚙️ Environment Variables

Create a `backend/.env` file with the following:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/hcp_crm
```

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete technical deep-dive — architecture diagrams, tech stack rationale, agent loop walkthrough, design decisions |
| [DEMO_GUIDE.md](./DEMO_GUIDE.md) | 10-minute demo script, code walkthrough guide, and 20 prepared Q&A answers for technical presentations |
| [QMS_DOMAIN_GUIDE.md](./QMS_DOMAIN_GUIDE.md) | Life Sciences QMS domain knowledge — Deviation, CAPA, Complaints, Recalls, Supplier Management |

---

## 🧪 Connecting to the Database (DBeaver)

To inspect your data visually, connect DBeaver with these settings:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `hcp_crm` |
| Username | `postgres` |
| Password | `postgres` |

Navigate to **Databases → hcp_crm → Schemas → public → Tables** to see `hcps` and `interactions`.

---

## 🛣️ Roadmap

- [ ] **Alembic Migrations** — Replace `create_all()` with versioned schema migrations
- [ ] **Authentication** — JWT-based login for multi-user support
- [ ] **Voice Input** — Speech-to-text via Whisper API for hands-free logging
- [ ] **Interaction History UI** — Frontend page to browse and filter past interactions
- [ ] **Compliance Validation** — Automated rules (e.g., max samples per visit)
- [ ] **LangSmith Observability** — Monitor agent behavior and debug tool-call chains
- [ ] **Offline Mode** — On-device LLM via Ollama for disconnected use

---

## 📄 License

This project is for educational and demonstration purposes.

---

Built with ❤️ using React, FastAPI, LangGraph, and Groq.
