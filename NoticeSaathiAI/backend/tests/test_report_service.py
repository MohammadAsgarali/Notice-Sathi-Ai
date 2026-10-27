import os
from backend.models import Notice, ExtractedField, ChecklistTask
from backend.services.report_service import report_service

def test_generate_html_report():
    notice = Notice(
        id=99,
        title="College Annual Exam Notice",
        category="Examination",
        issuing_org="Engineering Institute",
        summary_en="This is a simple plain-language summary.",
        summary_hi="यह एक सरल हिंदी सारांश है।",
        why_it_matters_en="Important for all 3rd year students.",
        missing_information_en="No offline venue mentioned."
    )
    notice.extracted_fields = [
        ExtractedField(
            field_name="deadline",
            field_label="Application Deadline",
            extracted_value="30 Nov 2026",
            status="found",
            is_verified=True,
            supporting_quotation="Deadline: 30 Nov 2026"
        )
    ]
    notice.checklist_tasks = [
        ChecklistTask(
            task_title="Submit exam registration form",
            description="Complete submission online",
            status="pending",
            order_index=1,
            is_confirmed_requirement=True
        )
    ]

    html = report_service.generate_html_report(notice)
    assert "<!DOCTYPE html>" in html
    assert "College Annual Exam Notice" in html
    assert "NoticeSaathi Report" in html
    assert "Submit exam registration form" in html

def test_generate_pdf_report(tmp_path):
    notice = Notice(
        id=101,
        title="Sample Scholarship Report",
        category="Scholarship",
        issuing_org="Technical Board",
        summary_en="Summary of scholarship opportunities for meritorious students.",
        missing_information_en="Fee structure is not stated."
    )
    notice.extracted_fields = []
    notice.checklist_tasks = []

    pdf_out = str(tmp_path / "test_report.pdf")
    result_path = report_service.generate_pdf_report(notice, pdf_out)
    
    assert os.path.exists(result_path)
    assert os.path.getsize(result_path) > 500
