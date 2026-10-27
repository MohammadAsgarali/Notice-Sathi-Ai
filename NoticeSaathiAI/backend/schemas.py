from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Health Schemas ---
class OCRHealthResponse(BaseModel):
    available: bool
    engine: str = "Tesseract OCR"
    path: Optional[str] = None
    supported_languages: List[str] = ["eng", "hin"]
    message: str

class AIHealthResponse(BaseModel):
    available: bool
    configured_provider: str
    active_provider: str
    model_name: str
    is_mock_mode: bool
    message: str

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    app_name: str = "NoticeSaathi AI"
    ocr: OCRHealthResponse
    ai: AIHealthResponse
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Extracted Field / Evidence Schemas ---
class ExtractedFieldSchema(BaseModel):
    id: Optional[int] = None
    field_name: str
    field_label: str
    extracted_value: str
    status: str = "found"  # "found", "missing", "uncertain", "unreadable"
    supporting_quotation: Optional[str] = None
    page_number: Optional[int] = None
    confidence: float = 1.0
    is_verified: bool = False
    verification_note: Optional[str] = None
    uncertainty_note: Optional[str] = None

    class Config:
        from_attributes = True

# --- Checklist Schemas ---
class ChecklistTaskSchema(BaseModel):
    id: int
    notice_id: int
    task_title: str
    description: Optional[str] = None
    supporting_evidence_ref: Optional[str] = None
    deadline: Optional[str] = None
    is_confirmed_requirement: bool = True
    status: str = "pending"  # "pending", "completed", "needs_clarification"
    order_index: int = 0
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChecklistTaskUpdate(BaseModel):
    status: Optional[str] = None  # "pending", "completed", "needs_clarification"
    task_title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    is_confirmed_requirement: Optional[bool] = None

class ChecklistTaskCreate(BaseModel):
    task_title: str
    description: Optional[str] = None
    supporting_evidence_ref: Optional[str] = None
    deadline: Optional[str] = None
    is_confirmed_requirement: bool = True
    status: str = "pending"
    order_index: int = 0

# --- Conversation / Q&A Schemas ---
class QuestionRequest(BaseModel):
    question: str
    language: Optional[str] = "en"

class ClarificationConfirmRequest(BaseModel):
    message_id: int
    user_choice: str
    confirmed: bool = True

class ConversationMessageSchema(BaseModel):
    id: int
    notice_id: int
    role: str
    message: str
    supporting_evidence_refs: Optional[str] = None
    is_clarification: bool = False
    clarification_options: Optional[str] = None
    requires_confirmation: bool = False
    is_confirmed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

# --- Notice Creation & Response Schemas ---
class TextNoticeCreate(BaseModel):
    title: Optional[str] = "Pasted Notice"
    text: str = Field(..., min_length=10, description="Notice body text")
    language: Optional[str] = "en"

class URLNoticeCreate(BaseModel):
    url: str
    title: Optional[str] = None
    language: Optional[str] = "en"

class NoticeSummarySchema(BaseModel):
    id: int
    title: str
    category: str
    input_type: str
    original_filename: Optional[str] = None
    processing_status: str
    page_count: int
    has_ocr_used: bool
    ai_provider_used: str
    is_mock_inference: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NoticeDetailSchema(BaseModel):
    id: int
    title: str
    category: str
    input_type: str
    original_filename: Optional[str] = None
    source_url: Optional[str] = None
    extracted_text: str
    page_count: int
    page_text_json: Optional[str] = None
    has_ocr_used: bool
    ocr_uncertainty_note: Optional[str] = None
    processing_status: str
    error_message: Optional[str] = None
    
    issuing_org: Optional[str] = None
    purpose: Optional[str] = None
    intended_audience: Optional[str] = None
    
    selected_language: str
    summary_en: Optional[str] = None
    summary_hi: Optional[str] = None
    why_it_matters_en: Optional[str] = None
    why_it_matters_hi: Optional[str] = None
    who_should_pay_attention_en: Optional[str] = None
    who_should_pay_attention_hi: Optional[str] = None
    important_warnings_en: Optional[str] = None
    important_warnings_hi: Optional[str] = None
    missing_information_en: Optional[str] = None
    missing_information_hi: Optional[str] = None
    
    ai_provider_used: str
    is_mock_inference: bool
    gemma_model_used: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    extracted_fields: List[ExtractedFieldSchema] = []
    checklist_tasks: List[ChecklistTaskSchema] = []
    conversation_messages: List[ConversationMessageSchema] = []

    class Config:
        from_attributes = True

# --- Translation Schema ---
class TranslationRequest(BaseModel):
    target_language: str = Field(..., pattern="^(en|hi)$")

class TranslationResponse(BaseModel):
    notice_id: int
    language: str
    summary: str
    why_it_matters: Optional[str] = None
    who_should_pay_attention: Optional[str] = None
    important_warnings: Optional[str] = None
    missing_information: Optional[str] = None
    is_mock: bool = False

# --- Dashboard Statistics Schema ---
class DashboardStats(BaseModel):
    total_notices: int
    notices_awaiting_review: int
    incomplete_checklist_actions: int
    total_completed_actions: int
    notices_with_missing_or_uncertain_info: int
    category_distribution: Dict[str, int]
    recent_activity: List[NoticeSummarySchema]
