import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

NOTICES_DIR = os.path.abspath(r"C:\Users\HP\.gemini\antigravity\scratch\NoticeSaathiAI\sample_data\notices")
os.makedirs(NOTICES_DIR, exist_ok=True)

# Sample 1: Scholarship
SCHOLARSHIP_TEXT = """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL GOVERNMENT ANNOUNCEMENT]
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

# Sample 2: Exam Circular
EXAM_TEXT = """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL UNIVERSITY NOTICE]
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

# Sample 3: Health PSA
PSA_TEXT = """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL PUBLIC ANNOUNCEMENT]
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

# Sample 4: Ambiguous
AMBIGUOUS_TEXT = """[SYNTHETIC DEMONSTRATION NOTICE - NOT AN OFFICIAL ANNOUNCEMENT]
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

# Save text files
with open(os.path.join(NOTICES_DIR, "sample_1_scholarship.txt"), "w", encoding="utf-8") as f:
    f.write(SCHOLARSHIP_TEXT)

with open(os.path.join(NOTICES_DIR, "sample_2_exam_notice.txt"), "w", encoding="utf-8") as f:
    f.write(EXAM_TEXT)

with open(os.path.join(NOTICES_DIR, "sample_3_psa_ration_health.txt"), "w", encoding="utf-8") as f:
    f.write(PSA_TEXT)

with open(os.path.join(NOTICES_DIR, "sample_4_ambiguous_notice.txt"), "w", encoding="utf-8") as f:
    f.write(AMBIGUOUS_TEXT)

# Helper to create PDF
def make_pdf(text, filename, title):
    pdf_path = os.path.join(NOTICES_DIR, filename)
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(title, styles['Heading1']),
        Spacer(1, 12)
    ]
    for line in text.split("\n"):
        if line.strip():
            story.append(Paragraph(line.replace("&", "&amp;"), styles['Normal']))
            story.append(Spacer(1, 4))
    doc.build(story)
    print(f"Generated PDF: {pdf_path}")

make_pdf(SCHOLARSHIP_TEXT, "sample_1_scholarship.pdf", "National Merit Scholarship Notice")
make_pdf(EXAM_TEXT, "sample_2_exam_notice.pdf", "Apex Technical University Exam Notice")

# Helper to create PNG image for OCR testing
def make_image(text, filename):
    img_path = os.path.join(NOTICES_DIR, filename)
    img = Image.new('RGB', (1000, 700), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw simple clean text lines
    draw.text((40, 30), "MUNICIPAL CORPORATION HEALTH DEPARTMENT", fill=(15, 23, 42))
    draw.text((40, 60), "PUBLIC HEALTH ADVISORY: DENGUE PREVENTION CAMPAIGN 2026", fill=(13, 148, 136))
    
    y = 110
    for line in text.split("\n")[:18]:
        if line.strip():
            draw.text((40, y), line[:80], fill=(51, 65, 85))
            y += 26
    
    img.save(img_path)
    print(f"Generated Image: {img_path}")

make_image(PSA_TEXT, "sample_3_psa_ration_health.png")
print("All sample files generated successfully!")
