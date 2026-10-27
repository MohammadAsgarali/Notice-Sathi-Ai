import os
import shutil
import json
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Notice, ExtractedField, ChecklistTask, ConversationMessage
from ..schemas import (
    NoticeSummarySchema, NoticeDetailSchema, TextNoticeCreate, URLNoticeCreate,
    QuestionRequest, ClarificationConfirmRequest, ConversationMessageSchema,
    TranslationRequest, TranslationResponse, DashboardStats, ExtractedFieldSchema
)
from ..services.document_processor import document_processor
from ..services.gemma_service import gemma_service
from ..services.evidence_service import evidence_service
from ..services.checklist_service import checklist_service
from ..services.report_service import report_service
from ..config import settings

logger = logging.getLogger("noticesaathi.api")

router = APIRouter(tags=["Notices & Accessibility Analysis"])

# --- Helper to orchestrate notice analysis ---
async def _execute_analysis(notice: Notice, db: Session):
    """Orchestrates Gemma 4 interpretation, evidence verification, and checklist generation."""
    page_texts = json.loads(notice.page_text_json) if notice.page_text_json else []

    # 1. Model inference
    analysis = await gemma_service.analyze_notice(notice.extracted_text, page_texts)

    notice.title = analysis.get("title", notice.title)
    notice.category = analysis.get("category", notice.category)
    notice.issuing_org = analysis.get("issuing_org")
    notice.purpose = analysis.get("purpose")
    notice.intended_audience = analysis.get("intended_audience")
    
    notice.summary_en = analysis.get("summary_en")
    notice.summary_hi = analysis.get("summary_hi")
    notice.why_it_matters_en = analysis.get("why_it_matters_en")
    notice.why_it_matters_hi = analysis.get("why_it_matters_hi")
    notice.who_should_pay_attention_en = analysis.get("who_should_pay_attention_en")
    notice.who_should_pay_attention_hi = analysis.get("who_should_pay_attention_hi")
    notice.important_warnings_en = analysis.get("important_warnings_en")
    notice.important_warnings_hi = analysis.get("important_warnings_hi")
    notice.missing_information_en = analysis.get("missing_information_en")
    notice.missing_information_hi = analysis.get("missing_information_hi")

    notice.ai_provider_used = analysis.get("ai_provider_used", "mock")
    notice.is_mock_inference = analysis.get("is_mock_inference", True)
    notice.gemma_model_used = analysis.get("gemma_model_used", settings.GEMMA_MODEL)
    notice.processing_status = "analyzed"

    # 2. Evidence verification against extracted source text
    raw_fields = analysis.get("fields", [])
    verified_fields = evidence_service.validate_and_enrich_fields(
        raw_fields, notice.extracted_text, page_texts
    )

    # Save fields
    db.query(ExtractedField).filter(ExtractedField.notice_id == notice.id).delete()
    for f in verified_fields:
        ef = ExtractedField(
            notice_id=notice.id,
            field_name=f["field_name"],
            field_label=f["field_label"],
            extracted_value=f["extracted_value"],
            status=f["status"],
            supporting_quotation=f.get("supporting_quotation"),
            page_number=f.get("page_number"),
            confidence=f.get("confidence", 1.0),
            is_verified=f.get("is_verified", False),
            verification_note=f.get("verification_note"),
            uncertainty_note=f.get("uncertainty_note")
        )
        db.add(ef)

    # 3. Derive ordered checklist
    checklist_data = checklist_service.generate_checklist_from_extraction(analysis, verified_fields)
    checklist_service.sync_to_db(db, notice.id, checklist_data)

    db.commit()
    db.refresh(notice)
    return notice


# --- Endpoints ---

@router.post("/api/notices/upload", response_model=NoticeDetailSchema, status_code=status.HTTP_201_CREATED)
async def upload_notice_file(
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF or Image document upload, validates size/format, extracts text & pages,
    and runs grounded Gemma 4 analysis.
    """
    # Read file content safely
    contents = await file.read()
    file_size = len(contents)

    try:
        input_type = document_processor.validate_file(file.filename, file_size)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    # Save temporary file with sanitized name
    safe_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract text based on file type
    try:
        if input_type == "pdf":
            extract_res = document_processor.process_pdf(file_path)
        else:  # image
            extract_res = document_processor.process_image(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {str(e)}")

    # Create Notice in DB
    notice = Notice(
        original_filename=file.filename,
        input_type=input_type,
        file_path=file_path,
        extracted_text=extract_res["text"],
        page_count=extract_res["page_count"],
        page_text_json=json.dumps(extract_res["pages"]),
        has_ocr_used=extract_res["has_ocr_used"],
        ocr_uncertainty_note=extract_res.get("ocr_uncertainty_note"),
        processing_status="extracted",
        selected_language=language,
        title=file.filename.rsplit(".", 1)[0].replace("_", " ").title()
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # Run analysis
    await _execute_analysis(notice, db)
    return notice


@router.post("/api/notices/text", response_model=NoticeDetailSchema, status_code=status.HTTP_201_CREATED)
async def process_pasted_text(
    payload: TextNoticeCreate,
    db: Session = Depends(get_db)
):
    """Processes pasted notice text directly."""
    try:
        extract_res = document_processor.process_text(payload.text)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    notice = Notice(
        original_filename=payload.title or "Pasted Notice",
        input_type="text",
        extracted_text=extract_res["text"],
        page_count=1,
        page_text_json=json.dumps(extract_res["pages"]),
        has_ocr_used=False,
        processing_status="extracted",
        selected_language=payload.language or "en",
        title=payload.title or "Pasted Notice"
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    await _execute_analysis(notice, db)
    return notice


@router.post("/api/notices/url", response_model=NoticeDetailSchema, status_code=status.HTTP_201_CREATED)
async def process_notice_url(
    payload: URLNoticeCreate,
    db: Session = Depends(get_db)
):
    """Securely fetches public notice webpage and analyzes content."""
    try:
        extract_res = await document_processor.process_url(payload.url)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    title = payload.title or extract_res.get("title", "Online Notice")
    notice = Notice(
        original_filename=title,
        input_type="url",
        source_url=payload.url,
        extracted_text=extract_res["text"],
        page_count=extract_res["page_count"],
        page_text_json=json.dumps(extract_res["pages"]),
        has_ocr_used=extract_res["has_ocr_used"],
        processing_status="extracted",
        selected_language=payload.language or "en",
        title=title
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    await _execute_analysis(notice, db)
    return notice


@router.get("/api/notices", response_model=List[NoticeSummarySchema])
def list_notices(
    query: Optional[str] = Query(None, description="Search term in title or text"),
    category: Optional[str] = Query(None, description="Filter by notice category"),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Lists processed notices with optional search and category filters."""
    q = db.query(Notice)
    if category and category.lower() != "all":
        q = q.filter(Notice.category.ilike(f"%{category}%"))
    if query:
        q = q.filter(
            (Notice.title.ilike(f"%{query}%")) | 
            (Notice.extracted_text.ilike(f"%{query}%")) |
            (Notice.issuing_org.ilike(f"%{query}%"))
        )
    return q.order_by(desc(Notice.created_at)).limit(limit).all()


@router.get("/api/notices/{notice_id}", response_model=NoticeDetailSchema)
def get_notice_details(notice_id: int, db: Session = Depends(get_db)):
    """Retrieves full analysis, evidence items, and checklist for a notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")
    return notice


@router.delete("/api/notices/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    """Deletes a notice and all its associated checklist tasks, evidence, and messages."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")
    
    # Clean up uploaded file if present
    if notice.file_path and os.path.exists(notice.file_path):
        try:
            os.remove(notice.file_path)
        except Exception:
            pass

    db.delete(notice)
    db.commit()
    return None


@router.post("/api/notices/{notice_id}/analyze", response_model=NoticeDetailSchema)
async def reanalyze_notice(notice_id: int, db: Session = Depends(get_db)):
    """Re-runs Gemma 4 analysis and evidence extraction on an existing notice."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")
    
    await _execute_analysis(notice, db)
    return notice


@router.get("/api/notices/{notice_id}/evidence", response_model=List[ExtractedFieldSchema])
def get_notice_evidence(notice_id: int, db: Session = Depends(get_db)):
    """Retrieves verified evidence and quotations for all extracted facts."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")
    return notice.extracted_fields


@router.post("/api/notices/{notice_id}/questions", response_model=ConversationMessageSchema)
async def ask_notice_question(
    notice_id: int,
    payload: QuestionRequest,
    db: Session = Depends(get_db)
):
    """
    Submits a user question grounded in the current notice.
    Transparently detects absent requirements and demonstrates clarification flow for ambiguous items.
    """
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")

    # Save user message
    user_msg = ConversationMessage(
        notice_id=notice_id,
        role="user",
        message=payload.question
    )
    db.add(user_msg)

    # Extract field map for answering
    fields_data = [
        {
            "field_name": f.field_name,
            "field_label": f.field_label,
            "extracted_value": f.extracted_value,
            "status": f.status,
            "supporting_quotation": f.supporting_quotation
        }
        for f in notice.extracted_fields
    ]

    answer_res = await gemma_service.answer_question(
        payload.question,
        notice.extracted_text,
        fields_data
    )

    assistant_msg = ConversationMessage(
        notice_id=notice_id,
        role="assistant",
        message=answer_res["answer"],
        supporting_evidence_refs=answer_res.get("supporting_quotation"),
        is_clarification=answer_res.get("is_clarification_needed", False),
        clarification_options=answer_res.get("clarification_options"),
        requires_confirmation=answer_res.get("is_clarification_needed", False)
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


@router.post("/api/notices/{notice_id}/translate", response_model=TranslationResponse)
def translate_notice_summary(
    notice_id: int,
    payload: TranslationRequest,
    db: Session = Depends(get_db)
):
    """
    Switches or generates plain-language output in English or Hindi without re-uploading document.
    """
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")

    lang = payload.target_language
    notice.selected_language = lang
    db.commit()

    if lang == "hi":
        return TranslationResponse(
            notice_id=notice_id,
            language="hi",
            summary=notice.summary_hi or notice.summary_en or "कोई सारांश उपलब्ध नहीं है।",
            why_it_matters=notice.why_it_matters_hi,
            who_should_pay_attention=notice.who_should_pay_attention_hi,
            important_warnings=notice.important_warnings_hi,
            missing_information=notice.missing_information_hi,
            is_mock=notice.is_mock_inference
        )
    else:
        return TranslationResponse(
            notice_id=notice_id,
            language="en",
            summary=notice.summary_en or "No summary available.",
            why_it_matters=notice.why_it_matters_en,
            who_should_pay_attention=notice.who_should_pay_attention_en,
            important_warnings=notice.important_warnings_en,
            missing_information=notice.missing_information_en,
            is_mock=notice.is_mock_inference
        )


@router.get("/api/notices/{notice_id}/report")
def get_notice_report(
    notice_id: int,
    format: str = Query("html", pattern="^(html|pdf)$"),
    db: Session = Depends(get_db)
):
    """Generates a downloadable PDF report or printable HTML view."""
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail=f"Notice with ID {notice_id} not found.")

    safe_title = "".join(c for c in notice.title if c.isalnum() or c in (' ', '_', '-')).strip()[:30]
    safe_title = safe_title.replace(" ", "_")

    if format == "html":
        html = report_service.generate_html_report(notice)
        return HTMLResponse(content=html, status_code=200)
    else:
        pdf_filename = f"NoticeSaathi_Report_{notice.id}_{safe_title}.pdf"
        pdf_path = os.path.join(settings.UPLOAD_DIR, pdf_filename)
        output_file = report_service.generate_pdf_report(notice, pdf_path)
        
        media_type = "application/pdf" if output_file.endswith(".pdf") else "text/html"
        return FileResponse(
            path=output_file,
            filename=os.path.basename(output_file),
            media_type=media_type
        )


@router.get("/api/stats", response_model=DashboardStats)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """Returns actual real statistics calculated from the SQLite database."""
    total_notices = db.query(Notice).count()
    awaiting_review = db.query(Notice).filter(Notice.processing_status != "analyzed").count()
    
    incomplete_actions = db.query(ChecklistTask).filter(ChecklistTask.status == "pending").count()
    completed_actions = db.query(ChecklistTask).filter(ChecklistTask.status == "completed").count()

    # Notices with missing or uncertain fields
    uncertain_notices = db.query(ExtractedField.notice_id).filter(
        ExtractedField.status.in_(["missing", "uncertain"])
    ).distinct().count()

    # Category distribution
    categories = db.query(Notice.category).all()
    cat_counts = {}
    for (cat,) in categories:
        c_name = cat or "General"
        cat_counts[c_name] = cat_counts.get(c_name, 0) + 1

    recent = db.query(Notice).order_by(desc(Notice.created_at)).limit(5).all()

    return DashboardStats(
        total_notices=total_notices,
        notices_awaiting_review=awaiting_review,
        incomplete_checklist_actions=incomplete_actions,
        total_completed_actions=completed_actions,
        notices_with_missing_or_uncertain_info=uncertain_notices,
        category_distribution=cat_counts,
        recent_activity=[NoticeSummarySchema.model_validate(n) for n in recent]
    )
