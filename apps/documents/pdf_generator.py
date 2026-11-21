import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from apps.company.models import Company

def generate_expediente_pdf(expediente) -> bytes:
    """
    Generates a professional corporate PDF for the given Expediente,
    incorporating Company branding, dynamic fields values, header, footer and signature blocks.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    company = Company.objects.first()
    company_name = company.razon_social if company else "EMPRESA S.A.C."
    company_ruc = company.ruc if company else "20601234567"
    company_address = company.direccion if company else "Lima, Perú"
    company_header = company.encabezado_documental if company else "SISTEMA DE GESTIÓN DOCUMENTAL"
    company_footer = company.pie_pagina_documental if company else "Documento Electrónico Oficial"

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1, # Center
        textColor=colors.HexColor('#0b7285')
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#1f2937')
    )

    header_text_style = ParagraphStyle(
        'HeaderSmall',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#6b7280')
    )

    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937')
    )

    label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#374151')
    )

    value_style = ParagraphStyle(
        'FieldValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#111827')
    )

    elements = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph(f"<b>{company_name}</b><br/>{company_address} | RUC: {company_ruc}", styles['Normal']),
            Paragraph(f"<b>EXPEDIENTE:</b> {expediente.numero_expediente}<br/><b>FECHA:</b> {datetime.now().strftime('%d/%m/%Y')}", header_text_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[350, 170])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(header_table)

    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0b7285'), spaceBefore=6, spaceAfter=14))

    # 2. Document Title
    template_name = expediente.template.nombre if expediente.template else "EXPEDIENTE ELECTRÓNICO"
    elements.append(Paragraph(template_name.upper(), title_style))
    elements.append(Paragraph(f"N° {expediente.numero_expediente}", subtitle_style))
    elements.append(Spacer(1, 10))

    # 3. Expediente General Information
    elements.append(Paragraph("1. DATOS GENERALES DEL EXPEDIENTE", section_style))
    gen_data = [
        [Paragraph("Asunto / Requerimiento:", label_style), Paragraph(expediente.asunto, value_style)],
        [Paragraph("Solicitante / Beneficiario:", label_style), Paragraph(expediente.solicitante, value_style)],
        [Paragraph("Plantilla Maestra:", label_style), Paragraph(template_name, value_style)],
        [Paragraph("Estado Documental:", label_style), Paragraph(expediente.get_estado_display().upper(), value_style)],
        [Paragraph("Responsable de Registro:", label_style), Paragraph(expediente.responsable.full_name if expediente.responsable else "Sistema Central", value_style)],
    ]
    gen_table = Table(gen_data, colWidths=[150, 370])
    gen_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(gen_table)
    elements.append(Spacer(1, 12))

    # 4. Dynamic Fields Breakdown
    elements.append(Paragraph("2. INFORMACIÓN ESPECÍFICA Y CAMPOS DILIGENCIADOS", section_style))
    
    dyn_fields = expediente.template.fields.all().order_by('order') if expediente.template else []
    field_rows = []
    
    if dyn_fields.exists():
        for f in dyn_fields:
            val = expediente.dynamic_values.get(f.identifier, expediente.dynamic_values.get(f.docs_tag.strip('{}'), ''))
            display_val = str(val) if val not in [None, ''] else "(No especificado)"
            field_rows.append([
                Paragraph(f.name, label_style),
                Paragraph(display_val, value_style)
            ])
    else:
        for k, v in expediente.dynamic_values.items():
            field_rows.append([
                Paragraph(k.replace('_', ' ').capitalize(), label_style),
                Paragraph(str(v), value_style)
            ])

    if not field_rows:
        field_rows.append([Paragraph("Detalle:", label_style), Paragraph("Expediente procesado conforme.", value_style)])

    dyn_table = Table(field_rows, colWidths=[160, 360])
    dyn_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')])
    ]))
    elements.append(dyn_table)
    elements.append(Spacer(1, 15))

    # 5. Signatures and Verification block
    elements.append(Paragraph("3. CERTIFICACIÓN Y FIRMAS DIGITALES", section_style))
    sig_data = [
        [
            Paragraph("___________________________________<br/><b>RESPONSABLE DEL EXPEDIENTE</b><br/>" + (expediente.responsable.full_name if expediente.responsable else "Firma Autorizada"), header_text_style),
            Paragraph("___________________________________<br/><b>DIRECCIÓN DE ADMINISTRACIÓN</b><br/>Visto Bueno y Aprobación", header_text_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 25),
    ]))
    elements.append(sig_table)

    elements.append(Spacer(1, 25))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#9ca3af'), spaceBefore=5, spaceAfter=6))
    elements.append(Paragraph(company_footer, header_text_style))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
