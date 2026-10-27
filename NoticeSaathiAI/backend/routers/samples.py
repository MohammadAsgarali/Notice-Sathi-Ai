import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Notice
from ..schemas import NoticeDetailSchema
from .notices import _execute_analysis

router = APIRouter(prefix="/api/samples", tags=["Sample Demonstration Data"])

SAMPLE_NOTICES = [
    {
        "id_key": "scholarship",
        "title": "[DEMO] National Merit Higher Education Scholarship Scheme 2026-27",
        "category": "Scholarship",
        "input_type": "text",
        "issuing_org": "Directorate of Higher Technical Education (Synthetic Demonstration Authority)",
        "text": """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL GOVERNMENT ANNOUNCEMENT]
DIRECTORATE OF HIGHER TECHNICAL EDUCATION
NOTIFICATION NO: DHTE/SCHOLARSHIP/2026/04

Subject: Inviting Applications for National Merit Higher Education Scholarship 2026-27

1. PREAMBLE & OBJECTIVE:
Applications are invited from meritorious regular undergraduate and postgraduate students enrolled in recognized universities and technical institutes for the award of National Merit Higher Education Scholarships for the academic session 2026-27.

2. ELIGIBILITY CRITERIA:
- The candidate must have secured a minimum of 75% aggregate marks or 7.5 CGPA in the preceding qualifying examination.
- Candidate must be a regular full-time student in an approved college or university.
- Annual family income must not exceed INR 6,00,000 per annum.

3. IMPORTANT DATES & TIMELINE:
- Portal Opening Date: 01 November 2026
- Application Deadline: 15 December 2026 (11:59 PM IST)
- Late submissions will not be entertained under any circumstances.

4. MANDATORY DOCUMENTS REQUIRED:
- Marksheets of the previous qualifying examination (Self-attested).
- Valid Family Income Certificate issued by an authorized Sub-Divisional Magistrate (SDM) or Tehsildar.
- Active College Bonafide Student Certificate with enrollment number.
- National Identity proof (Aadhaar or Voter ID).
- Bank Passbook first page displaying applicant account number and IFSC code.

5. APPLICATION PROCEDURE:
Eligible candidates must register and submit their application online through the student scholarship portal at https://scholarships-demo.gov.in. After online submission, a signed printout of the application along with physical copies of documents must be submitted to the college nodal officer.

6. APPLICATION FEES:
No application fee or registration charge is payable by any applicant.

7. OFFICIAL HELPLINE & INQUIRIES:
- Email: scholarship-helpdesk@demo-dhte.gov.in
- Toll-free Helpline: 1800-200-2026 (Mon-Fri, 10:00 AM to 5:00 PM)

Note: Incomplete applications or applications with unverified income certificates shall be summarily rejected.
[END OF NOTICE]"""
    },
    {
        "id_key": "exam",
        "title": "[DEMO] End-Semester Examination Schedule & Registration Notice (Winter 2026)",
        "category": "Examination",
        "input_type": "text",
        "issuing_org": "Office of Controller of Examinations, Apex Technical University (Demo)",
        "text": """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL UNIVERSITY NOTICE]
APEX TECHNICAL UNIVERSITY
OFFICE OF THE CONTROLLER OF EXAMINATIONS
Ref: ATU/EXAM/W2026/NOTICE-88

NOTICE: Winter 2026 Theory and Practical End-Semester Examinations

1. TARGET AUDIENCE:
All regular B.Tech, M.Tech, and MCA students of 3rd, 5th, and 7th semesters.

2. EXAMINATION REGISTRATION SCHEDULE:
- Online exam form portal opens: 28 October 2026.
- Application Deadline: 20 November 2026 without late fee.
- Examination Commencement: 10 December 2026.

3. EXAMINATION FEES:
- Regular Semester Examination Fee: INR 1,500 per semester.
- Backlog / Re-appear paper fee: INR 400 per subject.
- Payment must be completed via the ATU ERP payment gateway.

4. ELIGIBILITY FOR ADMIT CARD:
- Minimum 75% classroom and laboratory attendance in each registered subject.
- Clearance of all pending semester dues with the accounts department.

5. APPLICATION PROCEDURE & INSTRUCTIONS:
Students must login to their University ERP Portal at https://erp.apexuniversity-demo.edu, navigate to 'Exam Forms', select their registered subjects, and complete fee payment. Admit cards will be available for download 7 days prior to examination.

6. NOTEWORTHY OMISSIONS & AMBIGUITY:
- The notice does NOT specify whether an offline hall ticket hardcopy is required.
- Backlog syllabus regulations are tentative and subject to departmental notification.

7. CONTACT & GRIEVANCE:
Controller of Examinations Desk: examdesk@apexuniversity-demo.edu
[END OF NOTICE]"""
    },
    {
        "id_key": "psa",
        "title": "[DEMO] Public Health Advisory: Dengue Prevention and Free Diagnostic Camps",
        "category": "Public Service",
        "input_type": "text",
        "issuing_org": "Municipal Health Welfare Department (Demonstration Advisory)",
        "text": """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL PUBLIC ANNOUNCEMENT]
MUNICIPAL CORPORATION HEALTH DEPARTMENT
PUBLIC HEALTH ADVISORY: VECTOR-BORNE DISEASE PREVENTION CAMPAIGN 2026

1. BACKGROUND & PURPOSE:
In view of post-monsoon seasonal factors, the Municipal Health Department is organizing free community health diagnostic camps and mosquito abatement across all municipal wards from 01 November to 15 November 2026.

2. TARGET BENEFICIARIES:
All local citizens, families, and educational institutions within municipal jurisdiction.

3. PREVENTIVE INSTRUCTIONS FOR RESIDENTS:
- Check all domestic water storage coolers, flower pots, and overhead tanks weekly.
- Avoid stagnant water accumulation in and around residential premises.
- Report mosquito breeding hotspots to the sanitary inspection squad.

4. FREE DIAGNOSTIC CAMPS:
- Free NS1 Antigen and Platelet Count testing available at all Urban Primary Health Centres (UPHC).
- Time: Daily 8:00 AM to 2:00 PM.
- Emergency 24x7 Fever Helpline: 1075 or health-ward@demo-corp.gov.in.

5. NOTICE LIMITATIONS / MISSING INFORMATION:
- No application deadline applies (public awareness program).
- No documents or fees are required to access public camps.
- Specific neighborhood schedule of mobile fogging vans is not stated in this notice.
[END OF NOTICE]"""
    },
    {
        "id_key": "ambiguous",
        "title": "[DEMO - EDGE CASE] University Campus Internship Grant (Ambiguous Deadline Test)",
        "category": "Scholarship",
        "input_type": "text",
        "issuing_org": "Department of Research & Innovation (Demo Edge Case)",
        "text": """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL ANNOUNCEMENT]
DEPARTMENT OF RESEARCH AND INNOVATION
NOTICE: RESEARCH INTERNSHIP TRAVEL ASSISTANCE GRANT 2026-27

1. PURPOSE:
Travel grant assistance for research students presenting accepted papers at national symposia.

2. ELIGIBILITY:
Registered full-time Ph.D. scholars with an accepted peer-reviewed paper.

3. IMPORTANT NOTICE AMBIGUITY:
- Application deadline: Applications must be submitted 'shortly before conference dates' (Tentative, subject to chairperson approval).
- Required documents: No clear list of required documents is stated in this circular.
- Fee: No fee mentioned.
- Contact: No phone number or email address is mentioned.

This document is intentionally constructed with missing and ambiguous fields to test NoticeSaathi AI's uncertainty and missing-information detection engine.
[END OF NOTICE]"""
    }
]

@router.get("")
def list_sample_notices():
    """Lists available synthetic demo notices for one-click testing."""
    return [
        {
            "id_key": s["id_key"],
            "title": s["title"],
            "category": s["category"],
            "issuing_org": s["issuing_org"],
            "snippet": s["text"][:150] + "..."
        }
        for s in SAMPLE_NOTICES
    ]

@router.post("/load/{id_key}", response_model=NoticeDetailSchema, status_code=status.HTTP_201_CREATED)
async def load_sample_notice(id_key: str, db: Session = Depends(get_db)):
    """One-click loader for a synthetic demonstration notice."""
    match = next((s for s in SAMPLE_NOTICES if s["id_key"] == id_key), None)
    if not match:
        raise HTTPException(
            status_code=404,
            detail=f"Sample '{id_key}' not found. Valid keys: {[s['id_key'] for s in SAMPLE_NOTICES]}"
        )

    # Check if already loaded
    existing = db.query(Notice).filter(Notice.title == match["title"]).first()
    if existing:
        return existing

    notice = Notice(
        original_filename=f"synthetic_{id_key}.txt",
        input_type="text",
        extracted_text=match["text"],
        page_count=1,
        page_text_json=json.dumps([{"page_number": 1, "text": match["text"], "word_count": len(match["text"].split())}]),
        has_ocr_used=False,
        processing_status="extracted",
        selected_language="en",
        title=match["title"],
        category=match["category"],
        issuing_org=match["issuing_org"]
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    await _execute_analysis(notice, db)
    return notice
