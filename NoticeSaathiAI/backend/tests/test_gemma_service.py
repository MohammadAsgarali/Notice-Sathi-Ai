import asyncio
from backend.services.gemma_service import gemma_service

def test_gemma_analysis_multilingual():
    text = (
        "DIRECTORATE OF HIGHER TECHNICAL EDUCATION\n"
        "Scholarship Notice 2026\n"
        "Eligibility: Full-time undergraduate students with 75% marks.\n"
        "Application Deadline: 15 December 2026.\n"
        "No application fee.\n"
    )
    res = asyncio.run(gemma_service.analyze_notice(text))
    
    assert res["category"] == "Scholarship"
    assert "summary_en" in res and len(res["summary_en"]) > 20
    assert "summary_hi" in res and len(res["summary_hi"]) > 20
    assert res["is_mock_inference"] is True
    assert res["ai_provider_used"] == "mock-dev-mode"

def test_gemma_question_absent_requirement():
    text = "Exam notification: All regular students must register before 20 November 2026."
    fields = [{"field_name": "required_documents", "status": "missing", "extracted_value": "Not stated"}]
    
    ans = asyncio.run(gemma_service.answer_question("Is an income certificate required?", text, fields))
    assert ans["is_missing_in_notice"] is True
    assert "does not state or require an income certificate" in ans["answer"]

def test_gemma_question_ambiguous_deadline():
    text = "Travel grant assistance: deadline is tentative and subject to chairperson approval."
    fields = [
        {
            "field_name": "application_deadline",
            "status": "uncertain",
            "extracted_value": "Tentative, subject to chairperson approval",
            "supporting_quotation": "deadline is tentative"
        }
    ]

    ans = asyncio.run(gemma_service.answer_question("What is the deadline to apply?", text, fields))
    assert ans["is_clarification_needed"] is True
    assert ans["clarification_options"] is not None

def test_json_cleaner():
    raw_markdown = "```json\n{\"title\": \"Clean Notice\", \"category\": \"Exam\"}\n```"
    cleaned = gemma_service.clean_json_response(raw_markdown)
    assert cleaned["title"] == "Clean Notice"
    assert cleaned["category"] == "Exam"
