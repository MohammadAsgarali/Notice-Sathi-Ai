import os
import shutil
import logging
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageOps, ImageFilter

logger = logging.getLogger("noticesaathi.ocr")

class OCRService:
    def __init__(self, tesseract_cmd: Optional[str] = None, languages: str = "eng+hin"):
        self.languages = languages
        self.tesseract_cmd = self._detect_tesseract(tesseract_cmd)
        self.is_available = self.tesseract_cmd is not None
        
        if self.is_available:
            try:
                import pytesseract
                pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
                logger.info(f"Tesseract OCR initialized at: {self.tesseract_cmd}")
            except Exception as e:
                logger.warning(f"Error configuring pytesseract: {e}")
                self.is_available = False
        else:
            logger.warning("Tesseract OCR is not detected on this system. OCR features will report clear instructions.")

    def _detect_tesseract(self, explicit_path: Optional[str]) -> Optional[str]:
        """Detects Tesseract OCR executable on the system."""
        if explicit_path and os.path.isfile(explicit_path):
            return explicit_path

        # Check standard Windows paths
        win_candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
            os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
        ]
        for candidate in win_candidates:
            if os.path.isfile(candidate):
                return candidate

        # Check system PATH
        path_binary = shutil.which("tesseract")
        if path_binary:
            return path_binary

        return None

    def get_status(self) -> Dict[str, Any]:
        """Returns OCR engine status and actionable instructions if not available."""
        if self.is_available:
            return {
                "available": True,
                "engine": "Tesseract OCR",
                "path": self.tesseract_cmd,
                "supported_languages": ["eng", "hin"],
                "message": "Tesseract OCR is active and ready."
            }
        else:
            return {
                "available": False,
                "engine": "Tesseract OCR (Not Installed)",
                "path": None,
                "supported_languages": ["eng", "hin"],
                "message": (
                    "Tesseract OCR is not detected on your system. "
                    "For Windows: Download the installer from https://github.com/UB-Mannheim/tesseract/wiki "
                    "and install to 'C:\\Program Files\\Tesseract-OCR', or set TESSERACT_CMD in backend/.env. "
                    "Text-based PDFs and pasted notices continue to work without OCR."
                )
            }

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocesses image to enhance OCR text recognition."""
        # Convert RGBA or Palette to RGB first, then to Grayscale
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        gray = image.convert("L")
        
        # Scale up if image is small (width < 1200) to improve OCR on small fonts
        w, h = gray.size
        if w < 1200:
            scale_factor = 1200 / float(w)
            gray = gray.resize((int(w * scale_factor), int(h * scale_factor)), Image.Resampling.LANCZOS)
        
        # Auto contrast to normalize lighting/shadows
        enhanced = ImageOps.autocontrast(gray, cutoff=2)
        
        # Slight sharpening filter
        sharpened = enhanced.filter(ImageFilter.SHARPEN)
        return sharpened

    def extract_text_from_image(self, image_path: str) -> Tuple[str, float, Optional[str]]:
        """
        Extracts text from an image file.
        Returns: (extracted_text, confidence, uncertainty_note)
        """
        if not self.is_available:
            raise RuntimeError(
                "OCR is not available. Please install Tesseract OCR or paste notice text directly. "
                "See /api/health/ocr for installation instructions."
            )

        import pytesseract

        try:
            with Image.open(image_path) as img:
                processed = self.preprocess_image(img)
                
                # First attempt with configured languages (eng+hin)
                try:
                    text = pytesseract.image_to_string(processed, lang=self.languages)
                except Exception:
                    # Fallback to English if Hindi language pack is missing
                    text = pytesseract.image_to_string(processed, lang="eng")
                
                clean_text = text.strip()
                if not clean_text:
                    return "", 0.0, "No readable text detected in this image."
                
                # Check for OCR confidence estimation
                try:
                    data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
                    confidences = [int(c) for c in data.get("conf", []) if str(c).isdigit() and int(c) >= 0]
                    avg_conf = (sum(confidences) / len(confidences)) / 100.0 if confidences else 0.75
                except Exception:
                    avg_conf = 0.80

                uncertainty_note = None
                if avg_conf < 0.65:
                    uncertainty_note = "Low OCR confidence (<65%). Some characters or symbols might be imperfectly recognized."

                return clean_text, round(avg_conf, 2), uncertainty_note

        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            raise RuntimeError(f"OCR processing failed: {str(e)}")

# Singleton OCR service
from ..config import settings
ocr_service = OCRService(tesseract_cmd=settings.TESSERACT_CMD, languages=settings.TESSERACT_LANGUAGES)
