import os
import csv
from io import StringIO
from sqlalchemy.orm import Session
from datetime import datetime

from app import models
from app.config import settings

def generate_pdf_report(inspection_id: int, db: Session) -> str:
    """
    Generates a structured PDF Audit Report for the given inspection ID.
    Returns: PDF file path.
    """
    inspection = db.query(models.Inspection).filter(models.Inspection.id == inspection_id).first()
    if not inspection or not inspection.result:
        raise ValueError("Inspection result data not found")

    res = inspection.result
    filename = f"report_{inspection.case_id}.pdf"
    pdf_path = os.path.join(settings.REPORTS_DIR, filename)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        # Document setup
        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#0f172a'),  # Dark Slate
            spaceAfter=15
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e3a8a'),  # Royal Blue
            spaceBefore=10,
            spaceAfter=10
        )
        body_style = styles['BodyText']

        # Header Title
        story.append(Paragraph("VeriVision AI - Parts Fraud Inspection Report", title_style))
        story.append(Spacer(1, 10))

        # Metadata Table
        meta_data = [
            [Paragraph("<b>Case ID:</b>", body_style), Paragraph(str(inspection.case_id), body_style),
             Paragraph("<b>Date/Time:</b>", body_style), Paragraph(inspection.created_at.strftime("%Y-%m-%d %H:%M:%S"), body_style)],
            [Paragraph("<b>Part Number:</b>", body_style), Paragraph(inspection.product.part_number, body_style),
             Paragraph("<b>Capture Site:</b>", body_style), Paragraph(inspection.capture_site, body_style)],
            [Paragraph("<b>Camera Angle:</b>", body_style), Paragraph(inspection.capture_angle, body_style),
             Paragraph("<b>Operator ID:</b>", body_style), Paragraph(f"User {inspection.user_id}", body_style)]
        ]
        meta_table = Table(meta_data, colWidths=[100, 180, 100, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 15))

        # Inspection Verdict Card Table
        verdict_color = '#10b981'  # Green for clean
        if res.verdict == 'tampered':
            verdict_color = '#ef4444'  # Red
        elif res.verdict in ['missing', 'mismatched']:
            verdict_color = '#f59e0b'  # Orange

        verdict_data = [
            [Paragraph("<font size=16 color='white'><b>VERDICT SUMMARY</b></font>", body_style), ""],
            [Paragraph("<b>Final Verdict:</b>", body_style), Paragraph(f"<font color='{verdict_color}'><b>{res.verdict.upper()}</b></font>", body_style)],
            [Paragraph("<b>Fraud Score:</b>", body_style), Paragraph(f"<b>{res.fraud_score} / 100</b>", body_style)],
            [Paragraph("<b>Confidence Level:</b>", body_style), Paragraph(f"{res.confidence * 100:.1f}%", body_style)],
            [Paragraph("<b>Next Action Recommended:</b>", body_style), Paragraph(f"<b>{res.recommended_action}</b>", body_style)]
        ]
        verdict_table = Table(verdict_data, colWidths=[180, 360])
        verdict_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('SPAN', (0,0), (1,0)),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#faf5ff')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(verdict_table)
        story.append(Spacer(1, 15))

        # Detailed Findings Section
        story.append(Paragraph("Detailed Inspection Findings", section_heading))
        
        metrics_data = [
            ["Metric Analyzed", "Raw Value / Status"],
            ["SSIM Index (Structure)", f"{res.ssim_score:.3f}" if res.ssim_score else "N/A"],
            ["Keypoint Matches (Components)", f"{res.keypoint_match_rate * 100:.1f}%" if res.keypoint_match_rate else "N/A"],
            ["OCR Expected Markings", res.ocr_expected_text or "N/A"],
            ["OCR Detected Markings", res.ocr_detected_text or "N/A"]
        ]
        metrics_table = Table(metrics_data, colWidths=[240, 300])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 15))

        # Explanation Paragraph
        story.append(Paragraph("<b>AI System Explanation:</b>", body_style))
        story.append(Spacer(1, 5))
        story.append(Paragraph(res.explanation or "No explanation generated.", body_style))
        story.append(Spacer(1, 15))

        # Human Override & Review Logs Table
        audit_history = []
        for log in inspection.audit_logs or []:
            audit_history.append([
                Paragraph(log.timestamp.strftime("%Y-%m-%d %H:%M") if log.timestamp else "N/A", body_style),
                Paragraph(f"<b>{log.action.replace('_', ' ').title()}</b>", body_style),
                Paragraph(log.actor or "System", body_style),
                Paragraph(log.comments or "No comments.", body_style)
            ])

        if audit_history:
            story.append(Paragraph("Human Review & Override Audit Trail", section_heading))
            audit_data = [
                [Paragraph("<b>Timestamp</b>", body_style), 
                 Paragraph("<b>Action Taken</b>", body_style), 
                 Paragraph("<b>Auditor / Role</b>", body_style), 
                 Paragraph("<b>Supervisor Comments / Rationale</b>", body_style)]
            ]
            for row in audit_history:
                audit_data.append(row)
                
            audit_table = Table(audit_data, colWidths=[90, 120, 110, 220])
            audit_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            story.append(audit_table)
            story.append(Spacer(1, 15))

        # Footer Signature area
        story.append(Paragraph("<i>This report has been automatically generated by VeriVision-AI and is stored in the system audit trail.</i>", body_style))

        # Build PDF
        doc.build(story)
    except Exception as e:
        # Fallback to creating a plain text audit report if ReportLab fails
        print(f"ReportLab PDF generation error: {e}. Generating fallback plain text audit report.")
        txt_path = pdf_path.replace(".pdf", ".txt")
        with open(txt_path, "w") as f:
            f.write(f"VeriVision AI Audit Report\n")
            f.write(f"==========================\n")
            f.write(f"Case ID: {inspection.case_id}\n")
            f.write(f"Part Number: {inspection.product.part_number}\n")
            f.write(f"Verdict: {res.verdict}\n")
            f.write(f"Fraud Score: {res.fraud_score}\n")
            f.write(f"Explanation: {res.explanation}\n\n")
            f.write(f"Human Review & Override Audit Trail:\n")
            f.write(f"------------------------------------\n")
            for log in inspection.audit_logs or []:
                f.write(f"[{log.timestamp.strftime('%Y-%m-%d %H:%M') if log.timestamp else 'N/A'}] Action: {log.action} | Auditor: {log.actor} | Comments: {log.comments}\n")
        return txt_path

    return pdf_path

def generate_csv_export(inspections: list) -> str:
    """
    Exports a list of inspections into a CSV format.
    Returns: CSV string data.
    """
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Case ID", "Product Part Number", "Commodity", 
        "Capture Site", "Capture Angle", "Status", 
        "Date Created", "Verdict", "Fraud Score", "Action Recommended"
    ])
    
    for ins in inspections:
        verdict = ins.result.verdict if ins.result else "N/A"
        score = ins.result.fraud_score if ins.result else "N/A"
        action = ins.result.recommended_action if ins.result else "N/A"
        
        writer.writerow([
            ins.case_id, ins.product.part_number, ins.product.commodity,
            ins.capture_site, ins.capture_angle, ins.status,
            ins.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            verdict, score, action
        ])
        
    return output.getvalue()
