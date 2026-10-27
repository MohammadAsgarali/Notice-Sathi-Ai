import os
import asyncio
import pytest
from backend.services.document_processor import document_processor

def test_process_valid_text():
    sample = "This is a valid public university scholarship notice regarding 2026 admissions."
    res = document_processor.process_text(sample)
    assert res["page_count"] == 1
    assert "scholarship notice" in res["text"]
    assert res["has_ocr_used"] is False

def test_process_short_text_rejected():
    with pytest.raises(ValueError, match="too short"):
        document_processor.process_text("short")

def test_file_validation_allowed():
    assert document_processor.validate_file("notice.pdf", 1024) == "pdf"
    assert document_processor.validate_file("poster.png", 2048) == "image"
    assert document_processor.validate_file("document.jpg", 4096) == "image"

def test_file_validation_unsupported():
    with pytest.raises(ValueError, match="Unsupported file type"):
        document_processor.validate_file("script.exe", 1024)
    with pytest.raises(ValueError, match="Unsupported file type"):
        document_processor.validate_file("archive.zip", 1024)

def test_file_size_exceeded():
    huge_size = 20 * 1024 * 1024  # 20 MB > 15 MB limit
    with pytest.raises(ValueError, match="exceeds maximum allowed limit"):
        document_processor.validate_file("huge.pdf", huge_size)

def test_pdf_processing():
    sample_pdf = os.path.abspath(r"C:\Users\HP\.gemini\antigravity\scratch\NoticeSaathiAI\sample_data\notices\sample_1_scholarship.pdf")
    if os.path.exists(sample_pdf):
        res = document_processor.process_pdf(sample_pdf)
        assert res["page_count"] >= 1
        assert "Scholarship" in res["text"]

def test_ssrf_protection():
    with pytest.raises(ValueError, match="internal, private, or local network"):
        asyncio.run(document_processor.process_url("http://localhost:8000/secret"))
    with pytest.raises(ValueError, match="internal, private, or local network"):
        asyncio.run(document_processor.process_url("http://127.0.0.1:8080"))
    with pytest.raises(ValueError, match="internal, private, or local network"):
        asyncio.run(document_processor.process_url("http://192.168.1.1/admin"))
    with pytest.raises(ValueError, match="Only HTTP and HTTPS"):
        asyncio.run(document_processor.process_url("ftp://ftp.example.com/file"))
