from fastapi import APIRouter
from ..schemas import HealthResponse, OCRHealthResponse, AIHealthResponse
from ..services.ocr_service import ocr_service
from ..services.gemma_service import gemma_service

router = APIRouter(prefix="/api/health", tags=["Health & System Diagnostics"])

@router.get("", response_model=HealthResponse)
def get_system_health():
    """Returns comprehensive application health, OCR status, and Gemma AI runtime info."""
    ocr_status = ocr_service.get_status()
    ai_status = gemma_service.get_status()

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        app_name="NoticeSaathi AI",
        ocr=OCRHealthResponse(**ocr_status),
        ai=AIHealthResponse(**ai_status)
    )

@router.get("/ocr", response_model=OCRHealthResponse)
def get_ocr_health():
    """Returns OCR diagnostic details and installation instructions if unconfigured."""
    return OCRHealthResponse(**ocr_service.get_status())

@router.get("/ai", response_model=AIHealthResponse)
def get_ai_health():
    """Returns Gemma 4 model connection status and active provider."""
    return AIHealthResponse(**gemma_service.get_status())
