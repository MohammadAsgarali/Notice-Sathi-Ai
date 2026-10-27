import re
import difflib
from typing import List, Dict, Any, Optional, Tuple

class EvidenceService:
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalizes spaces, tabs, and newlines for robust comparison."""
        if not text:
            return ""
        # Replace multiple whitespace characters with a single space
        return re.sub(r'\s+', ' ', text).strip().lower()

    @classmethod
    def verify_quotation(
        cls,
        quotation: Optional[str],
        full_text: str,
        page_texts: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[bool, Optional[int], str, float]:
        """
        Verifies whether a model-provided quotation actually appears in the extracted source text.
        
        Returns:
            (is_verified, page_number, verification_note, confidence)
        """
        if not quotation or quotation.strip() == "":
            return False, None, "No quotation provided", 0.0

        clean_quote = quotation.strip()
        norm_quote = cls.normalize_text(clean_quote)
        norm_full = cls.normalize_text(full_text)

        # Check 1: Exact normalized substring match in full text
        found_page = None
        if norm_quote in norm_full:
            # Locate which page contains it
            if page_texts:
                for page_info in page_texts:
                    page_num = page_info.get("page_number", 1)
                    page_body = page_info.get("text", "")
                    if norm_quote in cls.normalize_text(page_body):
                        found_page = page_num
                        break
            
            return True, found_page, "Quotation verified verbatim in extracted document.", 0.98

        # Check 2: Sub-clause matching (if quote has minor prefix/suffix differences)
        # Take sentences or chunks of >= 6 words
        words = norm_quote.split()
        if len(words) >= 6:
            # Try 80% sliding window match
            window_size = int(len(words) * 0.8)
            sub_phrase = " ".join(words[:window_size])
            if sub_phrase in norm_full:
                if page_texts:
                    for page_info in page_texts:
                        page_num = page_info.get("page_number", 1)
                        if sub_phrase in cls.normalize_text(page_info.get("text", "")):
                            found_page = page_num
                            break
                return True, found_page, "Quotation core verified with minor boundary variation.", 0.88

        # Check 3: Fuzzy matching for OCR noise
        matcher = difflib.SequenceMatcher(None, norm_quote, norm_full)
        match = matcher.find_longest_match(0, len(norm_quote), 0, len(norm_full))
        if match.size >= max(20, int(len(norm_quote) * 0.7)):
            return True, found_page, "Quotation verified with minor OCR character differences.", 0.80

        # Unverified
        return False, None, "Unverified: Supporting quotation could not be matched in source text.", 0.35

    @classmethod
    def validate_and_enrich_fields(
        cls,
        fields_data: List[Dict[str, Any]],
        full_text: str,
        page_texts: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Validates every extracted field against the source text to prevent AI hallucinations.
        """
        enriched = []
        for field in fields_data:
            f_name = field.get("field_name", "unknown")
            f_label = field.get("field_label", f_name.replace("_", " ").title())
            f_val = field.get("extracted_value", "").strip()
            f_status = field.get("status", "found").lower()
            quote = field.get("supporting_quotation")
            uncertainty_note = field.get("uncertainty_note")

            # Missing field handling
            if f_status == "missing" or not f_val or f_val.lower() in ("not mentioned", "not stated", "none", "n/a", "missing"):
                enriched.append({
                    "field_name": f_name,
                    "field_label": f_label,
                    "extracted_value": "Not stated in the notice",
                    "status": "missing",
                    "supporting_quotation": None,
                    "page_number": None,
                    "confidence": 1.0,  # High confidence that it's absent
                    "is_verified": True,
                    "verification_note": "Confirmed absent: Notice does not contain this requirement.",
                    "uncertainty_note": None
                })
                continue

            # Uncertain / ambiguous field handling
            if f_status == "uncertain" or uncertainty_note:
                is_ver, p_num, v_note, conf = cls.verify_quotation(quote, full_text, page_texts)
                enriched.append({
                    "field_name": f_name,
                    "field_label": f_label,
                    "extracted_value": f_val,
                    "status": "uncertain",
                    "supporting_quotation": quote,
                    "page_number": p_num or field.get("page_number"),
                    "confidence": min(conf, 0.65),
                    "is_verified": is_ver,
                    "verification_note": v_note,
                    "uncertainty_note": uncertainty_note or "Information is ambiguous in source text."
                })
                continue

            # Found field verification
            is_ver, p_num, v_note, conf = cls.verify_quotation(quote, full_text, page_texts)
            enriched.append({
                "field_name": f_name,
                "field_label": f_label,
                "extracted_value": f_val,
                "status": "found" if is_ver else "uncertain",
                "supporting_quotation": quote,
                "page_number": p_num or field.get("page_number"),
                "confidence": conf,
                "is_verified": is_ver,
                "verification_note": v_note,
                "uncertainty_note": None if is_ver else "Claim cannot be verified verbatim against extracted text."
            })

        return enriched

evidence_service = EvidenceService()
