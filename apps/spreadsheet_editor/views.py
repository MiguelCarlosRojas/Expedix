from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.drives.models import DriveFile
from .models import SpreadsheetSync
from .google_sheets_service import GoogleSheetsService

class SpreadsheetDataView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, file_id):
        file_obj = get_object_or_404(DriveFile, pk=file_id, mime_type=DriveFile.MIME_SHEET)
        service = GoogleSheetsService()
        univer_data = service.get_or_create_univer_data(file_obj)

        sync_record, _ = SpreadsheetSync.objects.get_or_create(
            file=file_obj,
            defaults={
                'google_spreadsheet_id': file_obj.google_file_id,
                'univer_snapshot': univer_data
            }
        )

        return Response({
            'file_id': file_obj.id,
            'name': file_obj.name,
            'google_spreadsheet_id': file_obj.google_file_id,
            'univer_data': univer_data,
            'version': sync_record.version,
            'updated_at': file_obj.updated_at
        })

class SaveSpreadsheetView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, file_id):
        file_obj = get_object_or_404(DriveFile, pk=file_id, mime_type=DriveFile.MIME_SHEET)
        snapshot = request.data.get('snapshot')
        is_autosave = request.data.get('is_autosave', False)

        if not snapshot:
            return Response({'detail': 'No se proporcionaron datos de la hoja de cálculo.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update file content_data
        file_obj.content_data = snapshot
        file_obj.last_modified_by = request.user
        file_obj.save(update_fields=['content_data', 'last_modified_by', 'updated_at'])

        # Update or create sync record
        sync_record, _ = SpreadsheetSync.objects.get_or_create(
            file=file_obj,
            defaults={'google_spreadsheet_id': file_obj.google_file_id}
        )
        sync_record.univer_snapshot = snapshot
        sync_record.version += 1
        sync_record.save()

        # Synchronize with Google Sheets API v4
        service = GoogleSheetsService()
        sync_ok = service.sync_to_google_sheets(file_obj.google_file_id, snapshot)

        return Response({
            'message': 'Cambios guardados exitosamente en Google Sheets y base de datos.',
            'version': sync_record.version,
            'is_autosave': is_autosave,
            'updated_at': file_obj.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'google_synced': sync_ok
        })
