from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String(255), nullable=True)
    input_type = Column(String(50), nullable=False)  # "pdf", "image", "text", "url"
    source_url = Column(String(512), nullable=True)
    file_path = Column(String(512), nullable=True)
    
    # Raw & Page-aware text
    extracted_text = Column(Text, nullable=False, default="")
    page_count = Column(Integer, default=1)
    page_text_json = Column(Text, nullable=True)  # JSON array: [{"page_number": 1, "text": "..."}]
    
    # OCR & Processing metadata
    has_ocr_used = Column(Boolean, default=False)
    ocr_uncertainty_note = Column(String(512), nullable=True)
    processing_status = Column(String(50), default="extracted")  # "extracted", "analyzed", "error"
    error_message = Column(Text, nullable=True)
    
    # Extracted metadata
    title = Column(String(255), default="Untitled Notice")
    category = Column(String(100), default="General")  # "Scholarship", "Exam", "Admission", "PSA", etc.
    issuing_org = Column(String(255), nullable=True)
    purpose = Column(Text, nullable=True)
    intended_audience = Column(Text, nullable=True)
    
    # Plain Language Simplification (Multilingual)
    selected_language = Column(String(10), default="en")
    summary_en = Column(Text, nullable=True)
    summary_hi = Column(Text, nullable=True)
    why_it_matters_en = Column(Text, nullable=True)
    why_it_matters_hi = Column(Text, nullable=True)
    who_should_pay_attention_en = Column(Text, nullable=True)
    who_should_pay_attention_hi = Column(Text, nullable=True)
    important_warnings_en = Column(Text, nullable=True)
    important_warnings_hi = Column(Text, nullable=True)
    missing_information_en = Column(Text, nullable=True)
    missing_information_hi = Column(Text, nullable=True)
    
    # Gemma 4 / AI provenance
    ai_provider_used = Column(String(50), default="mock")
    is_mock_inference = Column(Boolean, default=True)
    gemma_model_used = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    extracted_fields = relationship(
        "ExtractedField", back_populates="notice", cascade="all, delete-orphan", lazy="selectin"
    )
    checklist_tasks = relationship(
        "ChecklistTask", back_populates="notice", cascade="all, delete-orphan", lazy="selectin",
        order_by="ChecklistTask.order_index"
    )
    conversation_messages = relationship(
        "ConversationMessage", back_populates="notice", cascade="all, delete-orphan", lazy="selectin",
        order_by="ConversationMessage.created_at"
    )

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    field_name = Column(String(100), nullable=False)  # e.g., "application_deadline", "eligibility", "fees"
    field_label = Column(String(150), nullable=False)  # User-friendly label
    extracted_value = Column(Text, nullable=False)
    
    # Status: "found", "missing", "uncertain", "unreadable"
    status = Column(String(50), default="found")
    
    supporting_quotation = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    confidence = Column(Float, default=1.0)
    
    # Verification against extracted source text
    is_verified = Column(Boolean, default=False)
    verification_note = Column(String(255), nullable=True)
    uncertainty_note = Column(String(512), nullable=True)

    notice = relationship("Notice", back_populates="extracted_fields")

class ChecklistTask(Base):
    __tablename__ = "checklist_tasks"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    task_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    supporting_evidence_ref = Column(Text, nullable=True)
    deadline = Column(String(100), nullable=True)
    
    # Distinguish confirmed requirement from suggested action
    is_confirmed_requirement = Column(Boolean, default=True)
    
    # Status: "pending", "completed", "needs_clarification"
    status = Column(String(50), default="pending")
    order_index = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notice = relationship("Notice", back_populates="checklist_tasks")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    role = Column(String(20), nullable=False)  # "user", "assistant"
    message = Column(Text, nullable=False)
    supporting_evidence_refs = Column(Text, nullable=True)
    
    # Clarification mechanics
    is_clarification = Column(Boolean, default=False)
    clarification_options = Column(Text, nullable=True)  # JSON string array of choices if ambiguous
    requires_confirmation = Column(Boolean, default=False)
    is_confirmed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    notice = relationship("Notice", back_populates="conversation_messages")
