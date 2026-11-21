from rest_framework import serializers
from .models import Expediente, DocumentStatusHistory
from apps.templates_manager.serializers import DocumentTemplateSerializer

class DocumentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentStatusHistory
        fields = ['id', 'from_status', 'to_status', 'comment', 'changed_by', 'changed_by_name', 'created_at']

    def get_changed_by_name(self, obj):
        return obj.changed_by.full_name if obj.changed_by else "Sistema"

class ExpedienteSerializer(serializers.ModelSerializer):
    template_details = DocumentTemplateSerializer(source='template', read_only=True)
    responsable_name = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    status_history = DocumentStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Expediente
        fields = [
            'id', 'numero_expediente', 'asunto', 'solicitante',
            'template', 'template_details',
            'estado', 'estado_display',
            'dynamic_values',
            'drive_id', 'drive_folder_id', 'drive_folder_name',
            'google_doc_id', 'google_doc_url',
            'pdf_drive_file_id', 'pdf_url', 'pdf_local_file',
            'error_message', 'retry_count', 'processing_time_seconds',
            'responsable', 'responsable_name',
            'fecha_generacion', 'status_history',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero_expediente', 'google_doc_id', 'google_doc_url',
            'pdf_drive_file_id', 'pdf_url', 'pdf_local_file',
            'error_message', 'retry_count', 'processing_time_seconds',
            'fecha_generacion', 'created_at', 'updated_at'
        ]

    def get_responsable_name(self, obj):
        return obj.responsable.full_name if obj.responsable else None

class ExpedienteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expediente
        fields = [
            'id', 'numero_expediente', 'asunto', 'solicitante', 'template', 'dynamic_values',
            'drive_id', 'drive_folder_id', 'drive_folder_name'
        ]
        read_only_fields = ['id', 'numero_expediente']
