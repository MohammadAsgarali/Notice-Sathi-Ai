# NoticeSaathi AI — REST API Reference

Interactive OpenAPI documentation is available live at `http://localhost:8000/docs` (FastAPI Swagger UI).

---

## 1. Health & Diagnostics

### `GET /api/health`
Returns comprehensive application status, OCR engine detection, and active Gemma 4 runtime info.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "app_name": "NoticeSaathi AI",
  "ocr": {
    "available": false,
    "engine": "Tesseract OCR (Not Installed)",
    "supported_languages": ["eng", "hin"],
    "message": "Tesseract OCR is not detected on your system..."
  },
  "ai": {
    "available": true,
    "configured_provider": "mock",
    "active_provider": "mock-dev-mode",
    "model_name": "google/gemma-4-it",
    "is_mock_mode": true,
    "message": "Transparent Mock/Dev mode active..."
  },
  "timestamp": "2026-10-25T17:35:00.000000Z"
}
```

### `GET /api/health/ocr`
Returns OCR engine path, languages, and installation guide.

### `GET /api/health/ai`
Returns Gemma 4 inference connection details and provider status.

---

## 2. Notice Ingestion & Processing

### `POST /api/notices/upload`
Uploads a PDF or Image file (multipart/form-data).

**Form Parameters**:
- `file`: Binary file (.pdf, .png, .jpg, .jpeg) [Max: 15 MB]
- `language`: `en` | `hi` (default: `en`)

**Response `201 Created`**: Returns full `NoticeDetailSchema`.

### `POST /api/notices/text`
Submits pasted notice text directly.

**Request Body**:
```json
{
  "title": "Scholarship Notice 2026",
  "text": "Full notice circular text...",
  "language": "en"
}
```

### `POST /api/notices/url`
Securely imports a public notice from a web URL with SSRF protection.

**Request Body**:
```json
{
  "url": "https://university.edu/notices/exam-winter.html",
  "title": "Winter Exam Notice",
  "language": "en"
}
```

---

## 3. Notice Management & Analysis

### `GET /api/notices`
Lists all notices.
- Query parameters:
  - `query`: Search string in title or extracted text
  - `category`: Filter by category (e.g., `Scholarship`, `Examination`, `Admission`, `All`)
  - `limit`: Maximum count (default: 50)

### `GET /api/notices/{notice_id}`
Returns complete analysis, multilingual summaries, extracted fields, verified evidence, checklist tasks, and Q&A history.

### `DELETE /api/notices/{notice_id}`
Deletes notice record, uploaded file, evidence, checklist tasks, and chat history. Returns `204 No Content`.

### `POST /api/notices/{notice_id}/analyze`
Re-runs Gemma 4 extraction and evidence verification on existing notice.

---

## 4. Evidence & Action Checklist

### `GET /api/notices/{notice_id}/evidence`
Returns all verified claims and verbatim source quotations.

### `GET /api/notices/{notice_id}/checklist`
Retrieves ordered action checklist tasks for the notice.

### `PATCH /api/checklist/{task_id}`
Updates completion status or task details.
```json
{
  "status": "completed"
}
```

### `POST /api/notices/{notice_id}/checklist`
Appends a custom user action task.

---

## 5. Grounded Q&A & Clarification

### `POST /api/notices/{notice_id}/questions`
Submits a follow-up question strictly grounded in the notice.
```json
{
  "question": "Is an income certificate required?",
  "language": "en"
}
```
**Response**:
```json
{
  "id": 14,
  "notice_id": 3,
  "role": "assistant",
  "message": "The notice does not state or require an income certificate...",
  "supporting_evidence_refs": null,
  "is_clarification": false
}
```

---

## 6. Multilingual Translation & Reports

### `POST /api/notices/{notice_id}/translate`
Switches summary language between `en` (English) and `hi` (Hindi) dynamically without re-uploading.

### `GET /api/notices/{notice_id}/report?format=html|pdf`
Generates downloadable ReportLab PDF or printable HTML report.

### `GET /api/stats`
Returns live dashboard counts calculated from the SQLite database.

### `POST /api/samples/load/{id_key}`
One-click preloaded synthetic notice loader (`scholarship`, `exam`, `psa`, `ambiguous`).
