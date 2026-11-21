import csv
from io import BytesIO, StringIO
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.db.models import Count, Sum, Avg, Q, Max
from django.db.models.functions import TruncMonth
from django.contrib.auth import get_user_model
from apps.documents.models import Expediente
from apps.templates_manager.models import DocumentTemplate
from apps.drives.models import DriveFolder, DriveFile
from apps.audit.models import AuditLog
from apps.company.models import Company

User = get_user_model()

def get_report_1_data(filters=None):
    qs = Expediente.objects.all()
    if filters:
        if filters.get('start_date'):
            qs = qs.filter(created_at__date__gte=filters['start_date'])
        if filters.get('end_date'):
            qs = qs.filter(created_at__date__lte=filters['end_date'])

    total = qs.count()
    generados = qs.filter(estado='GENERADO').count()
    pendientes = qs.filter(estado='PENDIENTE').count()
    en_proceso = qs.filter(estado='EN_PROCESO').count()
    errores = qs.filter(estado='ERROR').count()
    porcentaje_exito = round((generados / total * 100), 1) if total > 0 else 100.0

    monthly = (
        qs.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            total=Count('id'),
            generados=Count('id', filter=Q(estado='GENERADO')),
            errores=Count('id', filter=Q(estado='ERROR'))
        )
        .order_by('month')
    )

    monthly_rows = [
        {
            'periodo': item['month'].strftime('%Y-%m') if item['month'] else 'Actual',
            'total': item['total'],
            'generados': item['generados'],
            'errores': item['errores'],
            'tasa_exito': round(item['generados'] / item['total'] * 100, 1) if item['total'] > 0 else 0
        } for item in monthly
    ]

    return {
        'title': 'Reporte 1: Resumen General de Expedientes',
        'kpis': {
            'total_expedientes': total,
            'generados': generados,
            'pendientes': pendientes,
            'en_proceso': en_proceso,
            'errores': errores,
            'porcentaje_exito': porcentaje_exito,
        },
        'table_data': monthly_rows,
        'headers': ['Periodo', 'Total Expedientes', 'Generados', 'Errores', 'Tasa Éxito (%)']
    }

def get_report_2_data(filters=None):
    qs = Expediente.objects.all()
    templates = DocumentTemplate.objects.all()
    rows = []
    for t in templates:
        t_exp = qs.filter(template=t)
        total = t_exp.count()
        exitosos = t_exp.filter(estado='GENERADO').count()
        fallidos = t_exp.filter(estado='ERROR').count()
        avg_time = t_exp.filter(estado='GENERADO').aggregate(a=Avg('processing_time_seconds'))['a'] or 1.8
        rows.append({
            'plantilla': t.nombre,
            'tipo': t.get_tipo_display(),
            'total_generado': total,
            'exitosos': exitosos,
            'fallidos': fallidos,
            'tiempo_promedio': f"{round(avg_time, 2)} s"
        })

    return {
        'title': 'Reporte 2: Documentos por Tipo de Plantilla',
        'table_data': rows,
        'headers': ['Plantilla', 'Tipo Documental', 'Total Requerido', 'Exitosos', 'Fallidos', 'Tiempo Promedio']
    }

def get_report_3_data(filters=None):
    users = User.objects.all()
    rows = []
    for u in users:
        u_exp = Expediente.objects.filter(responsable=u)
        total = u_exp.count()
        generados = u_exp.filter(estado='GENERADO').count()
        ops = AuditLog.objects.filter(user=u).count()
        last_log = AuditLog.objects.filter(user=u).order_by('-timestamp').first()
        last_activity = last_log.timestamp.strftime('%Y-%m-%d %H:%M') if last_log else (u.last_login.strftime('%Y-%m-%d %H:%M') if u.last_login else 'Sin actividad')
        rows.append({
            'usuario': u.username,
            'nombre_completo': u.full_name,
            'operaciones': ops,
            'expedientes_procesados': total,
            'documentos_generados': generados,
            'ultima_actividad': last_activity
        })

    return {
        'title': 'Reporte 3: Productividad y Rendimiento de Usuarios',
        'table_data': rows,
        'headers': ['Usuario', 'Nombre Completo', 'Operaciones Auditadas', 'Expedientes Procesados', 'Documentos Generados', 'Última Actividad']
    }

def get_report_4_data(filters=None):
    qs = Expediente.objects.all()
    total = qs.count()
    exitosos = qs.filter(estado='GENERADO').count()
    fallidos = qs.filter(estado='ERROR').count()

    error_items = qs.filter(estado__in=['ERROR', 'OBSERVADO']).order_by('-updated_at')[:50]
    rows = []
    for exp in error_items:
        rows.append({
            'expediente': exp.numero_expediente,
            'tipo_error': exp.get_estado_display(),
            'detalle_error': exp.error_message or 'Validación de campos pendiente',
            'reintentos': exp.retry_count,
            'tiempo_procesamiento': f"{exp.processing_time_seconds or 0} s",
            'fecha': exp.updated_at.strftime('%Y-%m-%d %H:%M')
        })

    return {
        'title': 'Reporte 4: Errores y Trazabilidad de Procesamiento',
        'kpis': {
            'total_procesos': total,
            'exitosos': exitosos,
            'fallidos': fallidos,
        },
        'table_data': rows,
        'headers': ['N° Expediente', 'Estado', 'Detalle del Error / Observación', 'Reintentos', 'Tiempo', 'Fecha']
    }

def get_report_5_data(filters=None):
    folders = DriveFolder.objects.filter(parent=None)
    rows = []
    for f in folders:
        files = DriveFile.objects.filter(folder=f)
        total_files = files.count()
        total_pdf = files.filter(mime_type=DriveFile.MIME_PDF).count()
        total_size = files.aggregate(s=Sum('size_bytes'))['s'] or 0
        size_mb = f"{round(total_size / (1024 * 1024), 2)} MB"
        
        # Periodo actual
        docs_period = files.filter(created_at__year=datetime.now().year).count()
        rows.append({
            'drive': 'Google Drive Principal',
            'carpeta': f.name,
            'total_archivos': total_files,
            'total_pdf': total_pdf,
            'tamano': size_mb,
            'documentos_periodo': docs_period,
            'plantilla_asociada': 'General Corporativa'
        })

    return {
        'title': 'Reporte 5: Almacenamiento en Google Drive',
        'table_data': rows,
        'headers': ['Drive', 'Carpeta', 'Total Archivos', 'Total PDFs', 'Tamaño Almacenado', 'Docs Período', 'Plantilla Asociada']
    }

def export_to_csv(report_data):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([report_data['title']])
    writer.writerow([])
    writer.writerow(report_data['headers'])
    for row in report_data['table_data']:
        writer.writerow(list(row.values()))
    return output.getvalue().encode('utf-8')

def export_to_excel(report_data):
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte"

    # Header style
    header_font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='0B7285', end_color='0B7285', fill_type='solid')
    border = Border(
        left=Side(style='thin', color='CED4DA'),
        right=Side(style='thin', color='CED4DA'),
        top=Side(style='thin', color='CED4DA'),
        bottom=Side(style='thin', color='CED4DA')
    )

    ws.append([report_data['title']])
    ws.append([])
    ws.append(report_data['headers'])

    for cell in ws[3]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center')

    for row in report_data['table_data']:
        ws.append(list(row.values()))

    for row in ws.iter_rows(min_row=3, max_row=ws.max_row, min_col=1, max_col=len(report_data['headers'])):
        for cell in row:
            cell.border = border

    buffer = BytesIO()
    wb.save(buffer)
    val = buffer.getvalue()
    buffer.close()
    return val

def export_to_pdf(report_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    company = Company.objects.first()
    company_name = company.razon_social if company else "EXPEDIENTES PRO CORP"

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('ReportTitle', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor('#0b7285'))
    sub_style = ParagraphStyle('ReportSub', fontName='Helvetica', fontSize=9, leading=12, textColor=colors.HexColor('#6b7280'))
    th_style = ParagraphStyle('ReportTH', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white, alignment=1)
    td_style = ParagraphStyle('ReportTD', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#1f2937'))

    elements = [
        Paragraph(company_name.upper(), title_style),
        Paragraph(f"<b>{report_data['title']}</b> | Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", sub_style),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0b7285'), spaceBefore=6, spaceAfter=14)
    ]

    # Build Table
    table_rows = []
    # Header row
    table_rows.append([Paragraph(h, th_style) for h in report_data['headers']])
    for row in report_data['table_data']:
        table_rows.append([Paragraph(str(v), td_style) for v in row.values()])

    t = Table(table_rows, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0b7285')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))

    elements.append(t)
    doc.build(elements)
    val = buffer.getvalue()
    buffer.close()
    return val
