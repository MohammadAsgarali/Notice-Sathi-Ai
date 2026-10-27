# NoticeSaathi AI — Notice-to-Action Accessibility Assistant

[![Track](https://img.shields.io/badge/Hacktoberfest%202026-Track%201%3A%20Best%20Use%20of%20Gemma%204-0d9488?style=for-the-badge)](https://github.com)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-PS%2002%20Accessibility-0284c7?style=for-the-badge)](https://github.com)
[![Accessibility](https://img.shields.io/badge/Standards-WCAG%202.2%20AA-16a34a?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Tests-22%2F22%20Passed-10b981?style=for-the-badge)](https://pytest.org)

> **NoticeSaathi AI** converts complex, lengthy, image-based, and multilingual college circulars, scholarship notices, exam schedules, and public advisories into simple, evidence-backed, actionable information with step-by-step checklists, voice narration, and grounded Q&A.

---

## 🌟 Key Features

1. **Multi-Modal Notice Ingestion**:
   - **PDF Documents**: Multi-page selectable text extraction via PyMuPDF / PyPDF2 with page number mapping.
   - **Image Notices & Scanned Circulars**: Automated OCR with Pillow image enhancement (auto-contrast, sharpening, scaling) and Tesseract engine detection.
   - **Pasted Notice Text**: Immediate raw text entry with character/word counting.
   - **Public Notice URL Import**: Secure web scraping with strict **SSRF Protection** against internal and private networks.

2. **Gemma 4 AI Interpretation**:
   - Extraction of 15 structured parameters: *Title, Category, Issuing Organization, Purpose, Target Audience, Eligibility Criteria, Start Date, Deadline, Required Documents, Application Procedure, Fees, Official Links/Contacts, Immediate Actions, and Ambiguities*.
   - **Strict Grounding Rules**: The model treats notices strictly as data, never guesses missing information, and flags absent requirements explicitly.

3. **Verbatim Evidence & Hallucination Guard**:
   - Dedicated **Evidence & Verification Matrix** matching every model claim against extracted source text.
   - Quotation verification tagging exact page numbers where quotes appear.
   - Visual badges for `Verified` claims and explicit warnings for `Unverified` claims.

4. **Plain-Language Multilingual Output**:
   - Concise plain-language summaries in both **English** and **हिंदी (Hindi)**.
   - Dynamic language switching without requiring users to re-upload documents.
   - Honest accessibility disclosure: labels translations as comprehension aids, never as official certified translations.

5. **Actionable Checklist with Real Persistence**:
   - Ordered, practical tasks derived directly from notice requirements.
   - Clear distinction between **Official Requirements** and **Suggested Best Practices**.
   - Interactive checkbox state persists immediately to the SQLite database via `PATCH /api/checklist/{task_id}`.

6. **Grounded Follow-Up Q&A & Clarification Engine**:
   - Conversational chat grounded strictly in the active notice context.
   - **Missing Requirement Behavior**: Demonstrates transparent missing-information detection (e.g. asking if an income certificate is needed when the notice omits it).
   - **Ambiguity Clarifier**: When a timeline is tentative, the assistant explains the ambiguity and presents selectable clarification options.

7. **Accessibility First (WCAG 2.2 AA)**:
   - **High-Contrast Mode**: Single-click switch to high-contrast palette.
   - **Dynamic Font Scaling**: Instant resizing across 100%, 115%, and 130%.
   - **Web Speech API Narration**: In-browser audio player with play, pause, resume, stop, and speed controls for English & Hindi.
   - **Keyboard Navigable**: Visible focus indicators and skip-to-content links.

8. **Live SQLite Dashboard & Smart Reports**:
   - Real statistics (not hardcoded): total notices, pending checklist tasks, uncertain items, category distribution chart via Recharts.
   - Downloadable **ReportLab PDF Reports** and clean **Printable HTML Views**.

---

## 🏗️ Project Architecture

```text
NoticeSaathiAI/
├── frontend/                     # React 19 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/           # Navbar, Footer, AudioPlayer widgets
│   │   ├── hooks/                # useAccessibility context (High contrast, TTS, scale)
│   │   ├── pages/                # Landing, Dashboard, Upload, Detail, Q&A, History, Settings
│   │   ├── services/             # Axios API client (/api)
│   │   ├── App.jsx               # Routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                      # FastAPI Python Backend
│   ├── routers/
│   │   ├── health.py             # System diagnostics & OCR/AI status
│   │   ├── notices.py            # Upload, text, url, analyze, translate, reports
│   │   ├── checklist.py          # Checklist tasks & status updates
│   │   └── samples.py            # Preloaded synthetic notice loaders
│   ├── services/
│   │   ├── document_processor.py # PDF page extraction & SSRF URL scraper
│   │   ├── ocr_service.py        # Tesseract OCR & image preprocessor
│   │   ├── gemma_service.py      # Gemma 4 multi-runtime & grounded mock fallback
│   │   ├── evidence_service.py   # Verbatim quotation verification engine
│   │   ├── checklist_service.py  # Ordered task checklist synthesizer
│   │   └── report_service.py     # PDF (ReportLab) & HTML report generator
│   ├── tests/                    # Pytest automated test suite (22 tests)
│   ├── models.py                 # SQLAlchemy SQLite database models
│   ├── schemas.py                # Pydantic v2 schemas
│   ├── database.py               # Database engine & session
│   ├── config.py                 # Pydantic Settings & env configuration
│   ├── main.py                   # FastAPI app & CORS
│   └── requirements.txt
├── sample_data/
│   ├── notices/                  # Generated sample PDFs, text files, and images
│   └── evaluation/
│       ├── test_notices_15.json  # 15-notice evaluation benchmark dataset
│       ├── run_evaluation.py     # Benchmark runner script
│       └── evaluation_results.json # Actual measured evaluation results
├── docs/
│   ├── architecture.md           # In-depth system design & diagrams
│   ├── api.md                    # REST API documentation
│   ├── evaluation.md             # Benchmark evaluation report
│   └── troubleshooting.md        # Setup & resolution guide
├── Dockerfile                    # Backend Docker container with Tesseract
├── docker-compose.yml            # Multi-container Compose configuration
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm
- (Optional) Tesseract OCR for scanned document testing

---

### Step 1: Backend Setup (PowerShell / Windows)

```powershell
# Navigate to backend directory
cd C:\Users\HP\.gemini\antigravity\scratch\NoticeSaathiAI\backend

# Install backend dependencies
pip install -r requirements.txt

# Copy environment template
Copy-Item .env.example .env

# Initialize database
python -c "from backend.database import init_db; init_db()"

# Start FastAPI server on port 8000
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend Swagger UI will be available at: **http://127.0.0.1:8000/docs**

---

### Step 2: Frontend Setup

Open a new terminal window:

```powershell
# Navigate to frontend directory
cd C:\Users\HP\.gemini\antigravity\scratch\NoticeSaathiAI\frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend application will open at: **http://localhost:5173**

---

## 🤖 Gemma 4 Multi-Runtime Configuration

NoticeSaathi AI provides a flexible, honest AI service layer configured in `backend/.env`:

| Provider Mode | Setting in `backend/.env` | Description |
|:---|:---|:---|
| **Ollama (Local)** | `AI_PROVIDER=ollama`<br>`GEMMA_MODEL=gemma-4`<br>`GEMMA_API_BASE=http://localhost:11434/v1` | Local Gemma 4 inference via Ollama |
| **OpenAI-Compatible** | `AI_PROVIDER=openai-compatible`<br>`GEMMA_MODEL=google/gemma-4-it`<br>`GEMMA_API_BASE=http://localhost:8080/v1` | Compatible with vLLM, llama.cpp, LocalAI, Groq |
| **Google Gemini API** | `AI_PROVIDER=gemini`<br>`GEMINI_API_KEY=your_key` | Direct Google Gemini / Gemma API |
| **Transparent Mock / Dev** | `AI_PROVIDER=mock`<br>`MOCK_AI_MODE=true` | High-fidelity rule-grounded dev extractor. **Never pretends to be Gemma 4; explicitly labeled in UI.** |

---

## 🧪 Running Automated Tests

NoticeSaathi AI includes a full test suite testing all endpoints, document parsing, evidence verification, and Q&A:

```powershell
# Run backend tests
cd C:\Users\HP\.gemini\antigravity\scratch\NoticeSaathiAI
python -m pytest backend/tests/ -v
```

**Test Outcome:**
```text
======================= 22 passed in 5.13s =======================
```

---

## 📊 15-Notice Benchmark Evaluation

Execute the automated evaluation script on the 15-notice benchmark set:

```powershell
python sample_data/evaluation/run_evaluation.py
```

**Measured Results:**
- **Evidence Quotation Verification Accuracy**: `100.0%`
- **Missing Field Detection Accuracy**: `100.0%`
- **Deadline Extraction Accuracy**: `100.0%`
- **Workflow Completion Rate**: `15/15 (100%)`
- **Results Log**: `sample_data/evaluation/evaluation_results.json`

---

## 🎯 Mandatory Hackathon Demonstration Workflow

1. Open **http://localhost:5173**.
2. Click **Start Now — Analyze Notice** or **Upload Notice**.
3. Under the **One-Click Synthetic Demos** banner, click **🎓 Merit Scholarship**.
4. Review the **Plain-Language Summary** in English.
5. Click **हिंदी (Hindi)** to switch languages dynamically.
6. Click **Play** on the audio player to listen to narration via speech synthesis.
7. Inspect the **Actionable Checklist**: click the checkbox next to *"Gather Required Documents"* to mark it complete (persists to DB).
8. Inspect the **Evidence & Verification Matrix**: observe green *"Verified in document (P. 1)"* tags and exact quotes.
9. Click **Ask NoticeSaathi Q&A**:
   - Ask: *"Is an income certificate required?"* $\rightarrow$ Assistant quotes the income certificate requirement.
   - Switch notice to **[Demo] Winter Exam Notice** and ask: *"Is an income certificate required?"* $\rightarrow$ Assistant states: *"The notice does not state or require an income certificate."*
10. Click **Download PDF** to export the structured accessibility report.

---

## 📄 License & Attribution

Built for Hacktoberfest Hackday 2026. Licensed under the MIT License.
NoticeSaathi AI utilizes Google Gemma 4 and open-source accessibility tooling.
