# NoticeSaathi AI — Troubleshooting Guide

Common issues, configuration hints, and recovery steps for development and hackathon evaluation environments.

---

## 1. OCR (Tesseract) Detection & Setup

### Symptoms
- `/api/health/ocr` returns `available: false`.
- Uploading an image or scanned document gives a message instructing you to install Tesseract OCR.

### Solution
1. **Windows**:
   - Download the official Tesseract Windows installer: [UB-Mannheim Tesseract Wiki](https://github.com/UB-Mannheim/tesseract/wiki).
   - Install to `C:\Program Files\Tesseract-OCR`.
   - Add `C:\Program Files\Tesseract-OCR` to your System `PATH` **OR** set `TESSERACT_CMD` in `backend/.env`:
     ```env
     TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
     ```
2. **Ubuntu / Debian**:
   ```bash
   sudo apt update && sudo apt install -y tesseract-ocr tesseract-ocr-hin
   ```
3. **macOS**:
   ```bash
   brew install tesseract tesseract-lang
   ```
4. **No-OCR Workaround**:
   - NoticeSaathi is intentionally designed so **OCR is never a hard blocker**.
   - Text-based PDFs and pasted text notices work 100% without Tesseract installed.

---

## 2. Gemma 4 AI Runtime Configuration

### Symptoms
- Provenance badge displays `mock-dev-mode`.

### Solution
NoticeSaathi AI supports multiple real inference backends:

1. **Local Ollama Runtime**:
   - Start Ollama:
     ```bash
     ollama run gemma-4
     ```
   - In `backend/.env`:
     ```env
     AI_PROVIDER=ollama
     GEMMA_MODEL=gemma-4
     GEMMA_API_BASE=http://localhost:11434/v1
     ```

2. **OpenAI-Compatible Runtime (vLLM / llama.cpp / Groq / LocalAI)**:
   ```env
   AI_PROVIDER=openai-compatible
   GEMMA_MODEL=google/gemma-4-it
   GEMMA_API_BASE=http://localhost:8080/v1
   GEMMA_API_KEY=your-token-if-any
   ```

3. **Google Gemini / Gemma API**:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   GEMMA_MODEL=google/gemma-4-it
   ```

4. **Transparent Mock / Dev Mode**:
   - If no model server or API key is present, the app automatically switches to **Mock Mode**.
   - The UI clearly labels mock mode to maintain total honesty and provenance transparency.

---

## 3. Port Conflicts

- **Backend (8000)**:
  - If port 8000 is occupied, set `PORT=8080` in `backend/.env` and start Uvicorn:
    ```powershell
    uvicorn backend.main:app --host 127.0.0.1 --port 8080 --reload
    ```
  - In `frontend/vite.config.js`, update target to `http://127.0.0.1:8080`.
- **Frontend (5173)**:
  - Vite will automatically attempt the next available port (e.g. 5174) if 5173 is busy.

---

## 4. Resetting the Database

To clear test records and re-initialize the database:
```powershell
# In PowerShell:
Remove-Item backend/noticesaathi.db
python -c "from backend.database import init_db; init_db()"
```
