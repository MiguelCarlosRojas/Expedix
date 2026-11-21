from rest_framework import serializers
from .models import DynamicField

class DynamicFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicField
        fields = [
            'id', 'template', 'name', 'identifier', 'field_type', 'description',
            'placeholder', 'default_value', 'is_required', 'min_length', 'max_length',
            'min_value', 'max_value', 'options', 'order', 'section', 'width',
            'visibility_conditions', 'sheets_column', 'docs_tag',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_docs_tag(self, value):
        if value and (not value.startswith('{{') or not value.endswith('}}')):
            raise serializers.ValidationError("La etiqueta para Google Docs debe tener el formato {{NOMBRE_ETIQUETA}}.")
        return value.upper() if value else value
