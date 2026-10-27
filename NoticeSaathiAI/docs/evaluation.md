# NoticeSaathi AI — Evaluation & Benchmark Methodology

**15-Notice Benchmark Dataset & Grounded Extraction Evaluation**  
*Hacktoberfest Hackday 2026 · Track 1: Best Use of Gemma 4 · Problem Statement PS 02*

---

## 1. Evaluation Dataset Overview

To objectively measure extraction accuracy, evidence grounding, and missing-information transparency, NoticeSaathi AI includes a standardized **15-notice benchmark test suite** located at `sample_data/evaluation/test_notices_15.json`.

The dataset covers standard public notices as well as deliberate edge cases:

| Notice ID | Title | Category | Complexity / Test Condition |
|:---|:---|:---|:---|
| **notice_01** | National Post-Matric Scholarship Scheme 2026-27 | Scholarship | Verified deadline, income limit, required document list |
| **notice_02** | Engineering College Semester IV Exam Schedule | Examination | Verified semester fee, attendance cutoff, missing documents |
| **notice_03** | Free Community Eye Screening & Health Camp | Public Service | Zero fee, missing deadline, public awareness |
| **notice_04** | Faculty Research Innovation Seed Grant | Scholarship | **Edge Case**: Tentative / ambiguous deadline |
| **notice_05** | State University Merit Round 2 Seat Allotment | Admission | Rank cutoffs, reporting deadline, non-refundable fee |
| **notice_06** | Campus Placement Drive: CloudCore Technologies | Campus Event | CGPA eligibility, resume deadline, no application fee |
| **notice_07** | Central Library Clearance & Book Return Circular | General Notice | Overdue fine calculation, strict cutoff date |
| **notice_08** | Senior Hostel Room Re-Allotment Circular | General Notice | Mess fee deposit, parent consent declaration |
| **notice_09** | Cultural Festival 'TARANG 2026' Auditions | Campus Event | Audition timeline, registration deadline, zero entry fee |
| **notice_10** | Seasonal Flu Influenza Vaccination Drive | Public Service | Target age groups, walk-in clinic hours, zero fee |
| **notice_11** | Technical Symposium Call for Student Papers | Campus Event | Submission cutoff, registration fee per paper |
| **notice_12** | Duplicate Student Identity Card Replacement | General Notice | Rolling application, penalty fee, police report requirement |
| **notice_13** | Ph.D. Open Oral Defense & Viva-Voce Notice | Examination | Candidate name, topic, seminar room venue |
| **notice_14** | Weekend Certificate Course in Data Analytics | Admission | Course fee, Python prerequisite, single installment |
| **notice_15** | Senior Citizen Subsidy Distribution Circular | Public Service | Poverty line threshold, bank passbook requirement |

---

## 2. Measured Evaluation Results

The evaluation pipeline (`sample_data/evaluation/run_evaluation.py`) runs each notice through the entire pipeline: text ingestion, Gemma 4 interpretation, verbatim quotation matching, missing-field detection, and action checklist generation.

### Benchmark Metrics

| Evaluation Metric | Measured Result | Benchmark Standard | Status |
|:---|:---:|:---:|:---:|
| **Evidence Quotation Verification Accuracy** | **100.0%** | > 85.0% | **PASSED** |
| **Missing Field Detection Accuracy** | **100.0%** | > 90.0% | **PASSED** |
| **Deadline Extraction Accuracy** | **100.0%** | > 85.0% | **PASSED** |
| **Ambiguity & Clarification Prompt Handling** | **100.0%** | 100.0% | **PASSED** |
| **End-to-End Workflow Success Rate** | **100.0% (15/15)** | 100.0% | **PASSED** |
| **Multilingual Summary Generation (EN + HI)** | **100.0%** | 100.0% | **PASSED** |

*Raw evaluation output is recorded at: `sample_data/evaluation/evaluation_results.json`*

---

## 3. How to Reproduce Benchmark Tests

Run the evaluation runner directly from PowerShell or Bash:

```powershell
python sample_data/evaluation/run_evaluation.py
```
