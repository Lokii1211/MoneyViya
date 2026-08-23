# Viya 💚 — AI Second Brain for Money, Health & Life

Viya is an intelligent personal life operating system designed for Indian users. Talk to it in the **web app**, on **Android & iOS**, or directly over **WhatsApp** in natural conversational language — *"spent 500 on food"*, *"had lunch"*, *"gave 20000 to Rahul at 2% interest collect on 5th"*, *"should I do ELSS or PPF for 80C?"* — and Viya automatically logs structured records, sets precision reminders, and provides financial insights grounded in your **real data** and a **curated Indian personal finance knowledge base**.

🌐 **Live Web App:** [https://heyviya.vercel.app](https://heyviya.vercel.app)  
📱 **Mobile:** Android & iOS apps powered by Capacitor (`com.viyanexus.viya`)  
💬 **WhatsApp:** Meta WhatsApp Cloud API Integration  

---

## 🌟 Core Capabilities

- **Conversational Natural Language Logging**:
  - Automatically extracts and logs expenses, income, meals, health vitals (steps, water, sleep, weight), habits, lending/borrowing, bills & EMIs, investments, medicines, and reflective journal entries.
  - Understands English, Hindi, Tamil, Telugu, Kannada, Malayalam, and code-switched dialects (Hinglish / Tanglish).
- **Meta WhatsApp Cloud API & WhatsApp OTP Login**:
  - Chat seamlessly on WhatsApp with instant response times (<3s).
  - Secure 1-click passwordless login via 6-digit WhatsApp OTP.
- **Reminders & Due-Date Nudges**:
  - Scheduled checks every 15 minutes via GitHub Actions & Vercel Cron.
  - Automated advance nudges (5-minute trailing windows, 3-day advance monthly heads-up, EMI due alerts, and lending collection reminders).
- **Proactive Daily Briefings**:
  - Morning WhatsApp brief with yesterday's recap and today's agenda.
  - Evening check-in personalized to your daily logging activity.
- **Hybrid RAG & Grounded Financial Advisory**:
  - Fuses Postgres full-text search (`plfts`) with vector embeddings (`pgvector`) using Reciprocal Rank Fusion (RRF).
  - Grounded in your real data and an expert-curated Indian financial knowledge base (tax regimes, 80C, SIP compounding, term vs endowment, credit card interest traps).
- **Receipt OCR & Vision**:
  - Scans payment receipts and bill photos via Groq LLaMA 4 Scout vision model.
- **Smart Dashboards**:
  - Complete financial cockpit: Expenses, Daily/Monthly Budget, Signed Net Worth (Wealth), Debt/Lending tracker, Bills & Subscriptions, Health, Goals, and Habit Streaks.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies & Services |
|---|---|
| **Frontend** | React 19 (`19.2.4`), Vite (`8.0.4`), Zustand (`5.0.12`), Framer Motion, Vanilla CSS Design System |
| **Mobile** | Capacitor (`8.3.3`) for Android & iOS (`com.viyanexus.viya`) |
| **Backend & API** | Python Serverless Functions on Vercel (`frontend/api/*.py`, `@vercel/python@4.5.0`) |
| **Database** | Supabase PostgreSQL + **pgvector** (1536-dim cosine similarity) |
| **Chat LLM** | Groq — LLaMA 3.3 70B (`llama-3.3-70b-versatile`) |
| **Vision / OCR** | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` |
| **Embeddings** | OpenAI `text-embedding-3-small` (1536 dimensions) |
| **WhatsApp Integration** | Meta WhatsApp Cloud API (`frontend/api/whatsapp.py`, Graph API v21.0) |
| **Scheduled Tasks** | GitHub Actions (`.github/workflows/reminders.yml`) + Vercel Cron (`vercel.json`) |

### Repository Structure

```
├── .github/workflows/
│   ├── ci-cd.yml                     # Continuous integration, linting & test pipeline
│   └── reminders.yml                 # 15-minute reminder scheduler
├── database/
│   ├── 00_consolidated_migration.sql # Idempotent master PostgreSQL schema & indexes
│   └── supabase_schema.sql           # Base table definitions
├── frontend/
│   ├── android/                      # Native Android project (Capacitor)
│   ├── api/                          # Serverless backend functions
│   │   ├── chat.py                   # App chat, Groq actions agent, OCR, PDF reader
│   │   ├── whatsapp.py               # Meta WhatsApp Cloud API webhook & OTP auth
│   │   ├── whatsapp_client.py        # Centralized WhatsApp Graph API sender
│   │   ├── whatsapp_utils.py         # E.164 phone number normalizer
│   │   ├── _rag.py                   # Hybrid retriever (BM25 + vector + RRF + KG + KB)
│   │   ├── _intent_gate.py           # Pure-Python ML intent gate inference
│   │   ├── intent_gate_model.json    # Trained ML model weights
│   │   ├── bank-connect.py           # Setu Account Aggregator integration
│   │   ├── sms/process.py            # Indian bank SMS parser endpoint
│   │   ├── auth/gmail/               # Gmail OAuth & email intelligence
│   │   └── cron/                     # check-reminders, morning-brief, weekly-summary, ...
│   ├── src/                          # React application (pages, components, stores)
│   ├── capacitor.config.ts           # Capacitor mobile app configuration
│   └── package.json
├── ml/
│   ├── train_intent_gate.py          # Model trainer (scikit-learn TF-IDF + Logistic Regression)
│   └── README.md
└── tests/
    ├── data/intent_dataset.jsonl     # Labeled NLP intent dataset (200+ samples)
    ├── test_actions_offline.py       # Offline action parser & duplicate guard test suite
    └── eval_rag.py                   # Live intent & grounding accuracy evaluation harness
```

---

## 🧠 The Grounded RAG & Intent Gate System

### 1. Hybrid Retrieval Architecture (`frontend/api/_rag.py`)
Groq LLaMA is used strictly for final conversational generation. All knowledge and contextual memory are injected from Viya's multi-layered retrieval system:
- **Lexical + Vector Fusion**: Combines PostgreSQL Full-Text Search (`plfts`) with cosine distance (`pgvector`) via **Reciprocal Rank Fusion (RRF)**.
- **Strict Similarity Floors**: A strict cosine similarity threshold (`0.25` for personal data, `0.30` for news and knowledge base) filters out unrelated nearest-neighbor noise.
- **Knowledge Graph Walk**: Performs 1-hop traversal across `kg_edges` to connect related financial dependencies (e.g. goals stalling due to competing EMIs).
- **Curated Knowledge Base**: Pre-seeded with expert Indian financial facts (tax saving strategies, term insurance, emergency funds, SIP investing).

### 2. Multi-Tier Guardrails Against Phantom Logs
1. **Prompt Engineering (LOG vs. ASK)**: Explicitly separates event logging commands (*"spent 500 on dinner"*) from status queries (*"did you log my dinner?"*).
2. **Offline-Trained ML Intent Gate (`_intent_gate.py`)**:
   - A linear classifier trained on 200+ multilingual samples in `tests/data/intent_dataset.jsonl`.
   - Runs in **pure Python with zero runtime dependencies** and sub-millisecond latency.
   - Suppresses database write actions if the user query is identified as a question with ≥95% precision.
3. **Duplicate Guard (`recent_duplicate`)**: Prevents near-identical transactions or check-ins written within a 3-minute window.

---

## 🚀 Setup & Local Development

### 1. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Run `database/00_consolidated_migration.sql` in the Supabase SQL Editor.

### 2. Environment Variables
Create a `.env` file in the root or set variables in your Vercel project:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI & LLMs
GROQ_API_KEY=gsk_your_groq_api_key
OPENAI_API_KEY=sk-your_openai_api_key  # Optional: for vector search (lexical works without it)

# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
DEFAULT_COUNTRY_CODE=91

# Security & Cron
CRON_SECRET=your_secret_bearer_token
```

### 3. Frontend Web App
```bash
cd frontend
npm install
npm run dev        # Start local development server (http://localhost:5173)
npm run build      # Production build
```

### 4. Capacitor Mobile Build (Android)
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android   # Opens Android Studio for APK / Play Store bundle build
```

---

## 🧪 Testing & Model Training

```bash
# 1. Deterministic action parsing & duplicate guard test suite (20/20 PASS)
python3 tests/test_actions_offline.py

# 2. Retrain the pure-Python ML Intent Gate model
python3 ml/train_intent_gate.py

# 3. Live RAG Intent & Grounding evaluation (requires live deployment or local server)
python3 tests/eval_rag.py
```

---

## 📄 License & Attribution

Built with 💚 by the Viya Team.  
*Viya — Your money, health, and habits, on autopilot.*
