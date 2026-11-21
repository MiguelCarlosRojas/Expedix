from datetime import datetime
from django.http import HttpResponse
from rest_framework import views, permissions, status
from rest_framework.response import Response
from .report_services import (
    get_report_1_data, get_report_2_data, get_report_3_data,
    get_report_4_data, get_report_5_data,
    export_to_csv, export_to_excel, export_to_pdf
)

REPORT_MAP = {
    '1': get_report_1_data,
    '2': get_report_2_data,
    '3': get_report_3_data,
    '4': get_report_4_data,
    '5': get_report_5_data,
}

class ReportDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, report_id):
        generator = REPORT_MAP.get(str(report_id))
        if not generator:
            return Response({'detail': f'Reporte {report_id} no encontrado. Los reportes disponibles son del 1 al 5.'}, status=status.HTTP_404_NOT_FOUND)

        filters = {
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
            'template': request.query_params.get('template'),
            'usuario': request.query_params.get('usuario'),
        }
        data = generator(filters)
        return Response(data)

class ReportExportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        return (None, None)

    def get(self, request, report_id):
        generator = REPORT_MAP.get(str(report_id))
        if not generator:
            return Response({'detail': 'Reporte no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        export_format = request.query_params.get('format', 'excel').lower()
        filters = {
            'start_date': request.query_params.get('start_date'),
            'end_date': request.query_params.get('end_date'),
        }
        report_data = generator(filters)

        if export_format == 'csv':
            content = export_to_csv(report_data)
            response = HttpResponse(content, content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="reporte_{report_id}_{datetime.now():%Y%m%d}.csv"'
            return response
        elif export_format == 'pdf':
            content = export_to_pdf(report_data)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="reporte_{report_id}_{datetime.now():%Y%m%d}.pdf"'
            return response
        else: # Excel default
            content = export_to_excel(report_data)
            response = HttpResponse(content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="reporte_{report_id}_{datetime.now():%Y%m%d}.xlsx"'
            return response
