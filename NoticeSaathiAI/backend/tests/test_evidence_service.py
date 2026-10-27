from backend.services.evidence_service import evidence_service

def test_verbatim_quotation_match():
    full_text = "The last date for submission of online application is 15 December 2026 without late fee."
    pages = [{"page_number": 1, "text": full_text}]
    quote = "last date for submission of online application is 15 December 2026"

    is_verified, p_num, note, conf = evidence_service.verify_quotation(quote, full_text, pages)
    assert is_verified is True
    assert p_num == 1
    assert conf >= 0.85

def test_unverified_quotation_detected():
    full_text = "No fee is charged for registration."
    fake_quote = "All candidates must pay 5000 rupees fee immediately."
    
    is_verified, p_num, note, conf = evidence_service.verify_quotation(fake_quote, full_text)
    assert is_verified is False
    assert "could not be matched" in note

def test_missing_field_enrichment():
    fields = [
        {
            "field_name": "application_deadline",
            "field_label": "Application Deadline",
            "extracted_value": "Not stated in the notice",
            "status": "missing",
            "supporting_quotation": None
        }
    ]
    full_text = "General advisory regarding library timings."
    enriched = evidence_service.validate_and_enrich_fields(fields, full_text)
    
    assert len(enriched) == 1
    assert enriched[0]["status"] == "missing"
    assert enriched[0]["is_verified"] is True
    assert "Confirmed absent" in enriched[0]["verification_note"]
