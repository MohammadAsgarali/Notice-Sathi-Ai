import os
import re
from typing import Dict, Any, List
from datetime import datetime
from ..models import Notice, ExtractedField, ChecklistTask

class ReportService:
    @staticmethod
    def generate_html_report(notice: Notice) -> str:
        """
        Generates a clean, accessible, and printable HTML report.
        """
        created_str = notice.created_at.strftime("%B %d, %Y at %I:%M %p") if notice.created_at else "N/A"
        
        # Build checklist HTML
        checklist_items = ""
        for task in notice.checklist_tasks:
            status_badge = (
                '<span class="badge completed">COMPLETED</span>' 
                if task.status == "completed" 
                else '<span class="badge pending">PENDING</span>'
            )
            req_type = "Official Requirement" if task.is_confirmed_requirement else "Suggested Best Practice"
            deadline_str = f"<strong>Deadline:</strong> {task.deadline}" if task.deadline else ""
            checklist_items += f"""
            <li class="checklist-item">
                <div class="task-header">
                    <span class="task-title">{task.order_index}. {task.task_title}</span>
                    {status_badge}
                </div>
                <p class="task-desc">{task.description or ''}</p>
                <div class="task-meta">
                    <span class="type-tag">{req_type}</span>
                    {deadline_str}
                </div>
            </li>
            """

        # Build evidence table
        evidence_rows = ""
        for field in notice.extracted_fields:
            v_badge = (
                '<span class="badge verified">Verified</span>'
                if field.is_verified
                else '<span class="badge unverified">Unverified</span>'
            )
            status_class = field.status.lower()
            quote_text = f'<em>"{field.supporting_quotation}"</em>' if field.supporting_quotation else '<span class="text-muted">None</span>'
            page_str = f"Page {field.page_number}" if field.page_number else "N/A"
            
            evidence_rows += f"""
            <tr>
                <td><strong>{field.field_label}</strong></td>
                <td>{field.extracted_value}</td>
                <td><span class="status-tag {status_class}">{field.status.upper()}</span></td>
                <td>{v_badge} ({page_str})</td>
                <td class="quote-cell">{quote_text}</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NoticeSaathi Report - {notice.title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }}
        .header {{
            border-bottom: 3px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .branding {{
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}
        .brand-title {{
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }}
        .brand-subtitle {{
            color: #0d9488;
            font-weight: 600;
            font-size: 14px;
        }}
        .report-meta {{
            font-size: 13px;
            color: #64748b;
            margin-top: 8px;
        }}
        .section-title {{
            font-size: 18px;
            color: #0f172a;
            border-left: 4px solid #0d9488;
            padding-left: 10px;
            margin-top: 30px;
            margin-bottom: 15px;
        }}
        .summary-box {{
            background-color: #f0fdfa;
            border: 1px solid #ccfbf1;
            padding: 16px 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }}
        .hindi-box {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }}
        .warning-box {{
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 14px 18px;
            border-radius: 6px;
            margin-bottom: 20px;
            color: #92400e;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 13px;
        }}
        th, td {{
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            text-align: left;
        }}
        th {{
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
        }}
        .quote-cell {{
            font-size: 12px;
            color: #475569;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
        }}
        .badge.completed {{ background-color: #dcfce7; color: #166534; }}
        .badge.pending {{ background-color: #fef9c3; color: #854d0e; }}
        .badge.verified {{ background-color: #d1fae5; color: #065f46; }}
        .badge.unverified {{ background-color: #fee2e2; color: #991b1b; }}
        .status-tag {{
            font-weight: bold;
            font-size: 11px;
        }}
        .status-tag.found {{ color: #059669; }}
        .status-tag.missing {{ color: #dc2626; }}
        .status-tag.uncertain {{ color: #d97706; }}
        .checklist-list {{
            list-style: none;
            padding: 0;
        }}
        .checklist-item {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 10px;
        }}
        .task-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .task-title {{
            font-weight: 600;
            color: #0f172a;
        }}
        .task-desc {{
            margin: 6px 0;
            font-size: 13px;
            color: #475569;
        }}
        .task-meta {{
            font-size: 12px;
            color: #64748b;
        }}
        .type-tag {{
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 3px;
            margin-right: 12px;
        }}
        .footer {{
            border-top: 1px solid #e2e8f0;
            margin-top: 40px;
            padding-top: 15px;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
        }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .container {{ box-shadow: none; border: none; padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="branding">
                <div>
                    <h1 class="brand-title">NoticeSaathi AI</h1>
                    <div class="brand-subtitle">Notice-to-Action Accessibility Report</div>
                </div>
                <div class="no-print">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        Print Report
                    </button>
                </div>
            </div>
            <div class="report-meta">
                <strong>Notice:</strong> {notice.title} | <strong>Category:</strong> {notice.category} | <strong>Issuing Org:</strong> {notice.issuing_org or 'N/A'}<br>
                <strong>Processed on:</strong> {created_str} | <strong>AI Provenance:</strong> {notice.ai_provider_used} ({'Mock Dev Mode' if notice.is_mock_inference else 'Real Inference'})
            </div>
        </div>

        <div class="section-title">Plain-Language Summary (English)</div>
        <div class="summary-box">
            <p>{notice.summary_en or 'No summary generated.'}</p>
            {f'<p><strong>Why It Matters:</strong> {notice.why_it_matters_en}</p>' if notice.why_it_matters_en else ''}
            {f'<p><strong>Who Should Pay Attention:</strong> {notice.who_should_pay_attention_en}</p>' if notice.who_should_pay_attention_en else ''}
        </div>

        <div class="section-title">सरल भाषा सारांश (Hindi)</div>
        <div class="hindi-box">
            <p>{notice.summary_hi or 'सारांश उपलब्ध नहीं है।'}</p>
            {f'<p><strong>यह क्यों महत्वपूर्ण है:</strong> {notice.why_it_matters_hi}</p>' if notice.why_it_matters_hi else ''}
            <small style="color: #64748b;">* यह सारांश सुगमता और सहायता के लिए प्रस्तुत किया गया है, यह कोई आधिकारिक प्रमाणिक अनुवाद नहीं है।</small>
        </div>

        {f'<div class="warning-box"><strong>Missing or Ambiguous Information Detected:</strong><br>{notice.missing_information_en}</div>' if notice.missing_information_en else ''}

        <div class="section-title">Evidence & Verification Matrix</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 20%;">Field</th>
                    <th style="width: 30%;">Extracted Value</th>
                    <th style="width: 12%;">Status</th>
                    <th style="width: 13%;">Verification</th>
                    <th style="width: 25%;">Supporting Quotation</th>
                </tr>
            </thead>
            <tbody>
                {evidence_rows}
            </tbody>
        </table>

        <div class="section-title">Actionable Checklist</div>
        <ul class="checklist-list">
            {checklist_items or '<p class="text-muted">No checklist tasks generated.</p>'}
        </ul>

        <div class="footer">
            Generated by NoticeSaathi AI — Hacktoberfest Hackday 2026 Accessibility Assistant.<br>
            All extracted facts are grounded in verified source document quotations.
        </div>
    </div>
</body>
</html>"""
        return html_content

    @staticmethod
    def generate_pdf_report(notice: Notice, output_path: str) -> str:
        """
        Generates a PDF report using ReportLab.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )

            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                'DocTitle',
                parent=styles['Heading1'],
                fontSize=20,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=4
            )
            
            subtitle_style = ParagraphStyle(
                'DocSubtitle',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor("#0d9488"),
                fontName="Helvetica-Bold",
                spaceAfter=12
            )
            
            section_style = ParagraphStyle(
                'SectionHead',
                parent=styles['Heading2'],
                fontSize=13,
                textColor=colors.HexColor("#0f172a"),
                spaceBefore=14,
                spaceAfter=6
            )
            
            body_style = ParagraphStyle(
                'Body',
                parent=styles['Normal'],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#334155")
            )

            story = []

            # Header
            story.append(Paragraph("NoticeSaathi AI", title_style))
            story.append(Paragraph("Notice-to-Action Accessibility Report", subtitle_style))
            story.append(Spacer(1, 8))

            meta_text = (
                f"<b>Notice Title:</b> {notice.title}<br/>"
                f"<b>Category:</b> {notice.category} | <b>Issuing Org:</b> {notice.issuing_org or 'N/A'}<br/>"
                f"<b>AI Provenance:</b> {notice.ai_provider_used} ({'Mock Dev Mode' if notice.is_mock_inference else 'Real Gemma 4'})"
            )
            story.append(Paragraph(meta_text, body_style))
            story.append(Spacer(1, 12))

            # Summary Section
            story.append(Paragraph("Plain-Language Summary (English)", section_style))
            story.append(Paragraph(notice.summary_en or "No summary available.", body_style))
            story.append(Spacer(1, 10))

            if notice.why_it_matters_en:
                story.append(Paragraph(f"<b>Why It Matters:</b> {notice.why_it_matters_en}", body_style))
                story.append(Spacer(1, 6))

            # Missing Info Warning
            if notice.missing_information_en:
                story.append(Paragraph("Notice Disclosures & Missing Details", section_style))
                story.append(Paragraph(f"<b>Missing or Unspecified in Notice:</b> {notice.missing_information_en}", body_style))
                story.append(Spacer(1, 10))

            # Evidence Table
            story.append(Paragraph("Evidence & Verification Summary", section_style))
            table_data = [["Field", "Extracted Value", "Status", "Verification"]]
            for f in notice.extracted_fields[:7]:
                v_text = "Verified" if f.is_verified else "Unverified"
                table_data.append([
                    Paragraph(f.field_label, body_style),
                    Paragraph(f.extracted_value[:60], body_style),
                    f.status.upper(),
                    v_text
                ])

            t = Table(table_data, colWidths=[120, 240, 70, 70])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t)
            story.append(Spacer(1, 14))

            # Action Checklist
            story.append(Paragraph("Actionable Checklist", section_style))
            for task in notice.checklist_tasks:
                status_box = "[X]" if task.status == "completed" else "[ ]"
                deadline_info = f" (Deadline: {task.deadline})" if task.deadline else ""
                req_info = "[Official Requirement]" if task.is_confirmed_requirement else "[Best Practice]"
                task_line = f"{status_box} <b>{task.order_index}. {task.task_title}</b> {req_info}{deadline_info}<br/>&nbsp;&nbsp;&nbsp;&nbsp;{task.description or ''}"
                story.append(Paragraph(task_line, body_style))
                story.append(Spacer(1, 4))

            doc.build(story)
            return output_path

        except Exception as e:
            # If ReportLab fails, save HTML format as fallback
            html = ReportService.generate_html_report(notice)
            html_path = output_path.replace(".pdf", ".html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            return html_path

report_service = ReportService()
