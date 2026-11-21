from rest_framework import serializers
from .models import DriveFolder, DriveFile

class DriveFolderSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = DriveFolder
        fields = ['id', 'google_folder_id', 'name', 'parent', 'items_count', 'is_trashed', 'created_at', 'updated_at']
        read_only_fields = ['id', 'google_folder_id', 'created_at', 'updated_at']

    def get_items_count(self, obj):
        return obj.files.count() + obj.children.count()

class DriveFileSerializer(serializers.ModelSerializer):
    human_size = serializers.ReadOnlyField()

    class Meta:
        model = DriveFile
        fields = [
            'id', 'google_file_id', 'name', 'mime_type', 'size_bytes', 'human_size',
            'folder', 'owner_name', 'owner_email', 'web_view_link', 'web_content_link',
            'is_trashed', 'raw_html', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'google_file_id', 'created_at', 'updated_at']
