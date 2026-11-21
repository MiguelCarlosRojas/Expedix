from rest_framework import serializers
from .models import DocumentTemplate, TemplateVersion
from apps.dynamic_fields.serializers import DynamicFieldSerializer

class TemplateVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TemplateVersion
        fields = [
            'id', 'template', 'version_number', 'google_doc_id',
            'naming_pattern', 'changelog', 'content_snapshot',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

class DocumentTemplateSerializer(serializers.ModelSerializer):
    fields = DynamicFieldSerializer(many=True, read_only=True)
    versions_count = serializers.SerializerMethodField()
    fields_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'nombre', 'descripcion', 'tipo', 'google_doc_id', 'drive_id',
            'target_folder_id', 'target_folder_name', 'naming_pattern',
            'is_active', 'version', 'content_preview',
            'fields', 'fields_count', 'versions_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'version']

    def get_versions_count(self, obj):
        return obj.versions.count()

    def get_fields_count(self, obj):
        return obj.fields.count()

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None
