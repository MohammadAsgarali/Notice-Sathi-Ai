from backend.services.checklist_service import checklist_service
from backend.models import Notice

def test_checklist_generation():
    analysis = {
        "title": "Scholarship Notice 2026",
        "category": "Scholarship"
    }
    extracted_fields = [
        {
            "field_name": "eligibility_requirements",
            "field_label": "Eligibility",
            "extracted_value": "Minimum 75% marks in qualifying exam",
            "status": "found",
            "is_verified": True,
            "supporting_quotation": "Candidate must have secured minimum 75% marks"
        },
        {
            "field_name": "application_deadline",
            "field_label": "Deadline",
            "extracted_value": "15 December 2026",
            "status": "found",
            "is_verified": True,
            "supporting_quotation": "Deadline: 15 December 2026"
        },
        {
            "field_name": "required_documents",
            "field_label": "Documents",
            "extracted_value": "Income certificate, Marksheets",
            "status": "found",
            "is_verified": True,
            "supporting_quotation": "Income certificate, Marksheets"
        }
    ]

    tasks = checklist_service.generate_checklist_from_extraction(analysis, extracted_fields)
    assert len(tasks) >= 3
    
    # Check that confirmed requirement is flagged
    req_tasks = [t for t in tasks if t["is_confirmed_requirement"]]
    assert len(req_tasks) >= 2

    # Check that deadline is attached
    assert any(t["deadline"] == "15 December 2026" for t in tasks)

    # Check suggested best practice
    best_practice = [t for t in tasks if not t["is_confirmed_requirement"]]
    assert len(best_practice) >= 1
    assert "Save" in best_practice[0]["task_title"] or "Receipt" in best_practice[0]["task_title"]

def test_checklist_sync_to_db(db_session):
    notice = Notice(
        title="Test Notice",
        input_type="text",
        extracted_text="Some text",
        processing_status="analyzed"
    )
    db_session.add(notice)
    db_session.commit()
    db_session.refresh(notice)

    checklist_data = [
        {
            "task_title": "Action 1",
            "description": "Desc 1",
            "is_confirmed_requirement": True,
            "status": "pending",
            "order_index": 1
        }
    ]
    created = checklist_service.sync_to_db(db_session, notice.id, checklist_data)
    assert len(created) == 1
    assert created[0].notice_id == notice.id
    assert created[0].status == "pending"
