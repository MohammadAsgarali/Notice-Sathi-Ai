import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from urllib.parse import urlparse
import httpx

from .ocr_service import ocr_service
from ..config import settings

logger = logging.getLogger("noticesaathi.document_processor")

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
ALLOWED_PDF_EXTENSIONS = {".pdf"}
ALLOWED_TEXT_EXTENSIONS = {".txt", ".text"}

class DocumentProcessor:
    def __init__(self):
        self.max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024

    def validate_file(self, filename: str, file_size: int) -> str:
        """Validates extension and size, returns detected input type."""
        if file_size > self.max_bytes:
            raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_MB} MB.")

        ext = Path(filename).suffix.lower()
        if ext in ALLOWED_PDF_EXTENSIONS:
            return "pdf"
        elif ext in ALLOWED_IMAGE_EXTENSIONS:
            return "image"
        elif ext in ALLOWED_TEXT_EXTENSIONS:
            return "text"
        else:
            raise ValueError(
                f"Unsupported file type: '{ext}'. Supported formats: PDF (.pdf), Images (.png, .jpg, .jpeg), Text (.txt)."
            )

    def process_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Extracts text from PDF page-by-page.
        Falls back to OCR if selectable text is insufficient.
        """
        pages_data: List[Dict[str, Any]] = []
        full_text_chunks: List[str] = []
        ocr_used = False
        ocr_notes = []

        # Try PyMuPDF first
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            total_pages = len(doc)

            for page_idx in range(total_pages):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_text = page.get_text("text").strip()

                # Check if page has sufficient text (> 15 words)
                word_count = len(page_text.split())
                if word_count < 15:
                    # Page appears scanned or image-based, attempt OCR
                    if ocr_service.is_available:
                        try:
                            # Render page to pixmap
                            pix = page.get_pixmap(dpi=200)
                            temp_img = file_path + f"_p{page_num}.png"
                            pix.save(temp_img)
                            
                            ocr_text, conf, note = ocr_service.extract_text_from_image(temp_img)
                            if os.path.exists(temp_img):
                                os.remove(temp_img)
                            
                            if ocr_text:
                                page_text = ocr_text
                                ocr_used = True
                                if note:
                                    ocr_notes.append(f"Page {page_num}: {note}")
                        except Exception as ocr_err:
                            logger.warning(f"OCR failed for page {page_num}: {ocr_err}")
                    else:
                        if not page_text:
                            page_text = f"[Page {page_num}: Scanned or image content. Install Tesseract OCR to extract.]"
                            ocr_notes.append(f"Page {page_num} requires OCR engine.")

                pages_data.append({
                    "page_number": page_num,
                    "text": page_text,
                    "word_count": len(page_text.split())
                })
                full_text_chunks.append(f"--- Page {page_num} ---\n{page_text}")

            doc.close()

        except ImportError:
            # Fallback to PyPDF2 if PyMuPDF is not yet imported
            logger.info("Using PyPDF2 fallback for PDF text extraction")
            import PyPDF2
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                total_pages = len(reader.pages)
                for page_idx in range(total_pages):
                    page_num = page_idx + 1
                    page = reader.pages[page_idx]
                    page_text = (page.extract_text() or "").strip()
                    pages_data.append({
                        "page_number": page_num,
                        "text": page_text,
                        "word_count": len(page_text.split())
                    })
                    full_text_chunks.append(f"--- Page {page_num} ---\n{page_text}")

        combined_text = "\n\n".join(full_text_chunks).strip()
        if not combined_text:
            raise ValueError(
                "No readable text could be extracted from this PDF. "
                "If it is a scanned document, please ensure Tesseract OCR is installed."
            )

        return {
            "text": combined_text,
            "page_count": len(pages_data),
            "pages": pages_data,
            "has_ocr_used": ocr_used,
            "ocr_uncertainty_note": "; ".join(ocr_notes) if ocr_notes else None
        }

    def process_image(self, file_path: str) -> Dict[str, Any]:
        """Processes an image notice using OCR."""
        text, conf, note = ocr_service.extract_text_from_image(file_path)
        if not text.strip():
            raise ValueError(
                "No readable text could be extracted from this image. "
                "Please verify image clarity, lighting, or paste the notice text directly."
            )

        pages_data = [{
            "page_number": 1,
            "text": text,
            "word_count": len(text.split())
        }]

        return {
            "text": text,
            "page_count": 1,
            "pages": pages_data,
            "has_ocr_used": True,
            "ocr_uncertainty_note": note or f"Extracted via OCR (estimated confidence: {int(conf * 100)}%)"
        }

    def process_text(self, raw_text: str) -> Dict[str, Any]:
        """Processes pasted text notice."""
        clean_text = raw_text.strip()
        if len(clean_text) < 10:
            raise ValueError("Pasted notice is too short. Please provide at least 10 characters.")

        pages_data = [{
            "page_number": 1,
            "text": clean_text,
            "word_count": len(clean_text.split())
        }]

        return {
            "text": clean_text,
            "page_count": 1,
            "pages": pages_data,
            "has_ocr_used": False,
            "ocr_uncertainty_note": None
        }

    async def process_url(self, url: str) -> Dict[str, Any]:
        """
        Securely fetches public notice webpage and extracts clean body text.
        Implements SSRF protection and sanitization.
        """
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Only HTTP and HTTPS URLs are supported.")

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            raise ValueError("Invalid URL format.")

        # SSRF Protection: Block private IP ranges, localhost, AWS/cloud metadata
        blocked_hosts = {"localhost", "127.0.0.1", "::1", "metadata.google.internal"}
        if hostname in blocked_hosts or hostname.startswith("192.168.") or hostname.startswith("10."):
            raise ValueError("Access to internal, private, or local network addresses is prohibited.")
        if re.match(r"^172\.(1[6-9]|2[0-9]|3[0-1])\.", hostname):
            raise ValueError("Access to private IP ranges is prohibited.")

        headers = {
            "User-Agent": "NoticeSaathiAI-AccessibilityBot/1.0 (+https://noticesaathi.org)"
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=headers)
            except Exception as e:
                raise ValueError(f"Could not connect to URL: {str(e)}")

        if response.status_code != 200:
            raise ValueError(f"Failed to fetch notice from URL (HTTP status: {response.status_code})")

        content_type = response.headers.get("content-type", "").lower()
        
        # If PDF was linked directly
        if "application/pdf" in content_type:
            temp_pdf = os.path.join(settings.UPLOAD_DIR, f"url_notice_{os.getpid()}.pdf")
            with open(temp_pdf, "wb") as f:
                f.write(response.content)
            result = self.process_pdf(temp_pdf)
            if os.path.exists(temp_pdf):
                os.remove(temp_pdf)
            return result

        # Parse HTML text
        html = response.text
        # Strip script, style, header, footer, nav
        cleaned_html = re.sub(r'<(script|style|header|footer|nav)[\s\S]*?</\1>', '', html, flags=re.IGNORECASE)
        # Extract title
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        page_title = title_match.group(1).strip() if title_match else "Online Notice"

        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', cleaned_html)
        # Normalize whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        if len(clean_text) < 20:
            raise ValueError("Could not extract meaningful notice text from the given URL.")

        # Keep first 25,000 chars to avoid memory bloat
        final_text = f"Notice Title: {page_title}\nSource: {url}\n\n{clean_text[:25000]}"

        pages_data = [{
            "page_number": 1,
            "text": final_text,
            "word_count": len(final_text.split())
        }]

        return {
            "text": final_text,
            "title": page_title,
            "page_count": 1,
            "pages": pages_data,
            "has_ocr_used": False,
            "ocr_uncertainty_note": None
        }

document_processor = DocumentProcessor()
