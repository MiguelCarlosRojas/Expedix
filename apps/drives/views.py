from rest_framework import views, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import DriveFolder, DriveFile
from .serializers import DriveFolderSerializer, DriveFileSerializer
from .google_drive_service import GoogleDriveService
from apps.roles.permissions import HasModulePermission

class DriveExplorerView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        service = GoogleDriveService()
        service.ensure_default_hierarchy(request.user)

        folder_id = request.query_params.get('folder_id')
        search = request.query_params.get('search')
        mime_filter = request.query_params.get('type')

        data = service.list_contents(folder_id=folder_id, search=search, mime_filter=mime_filter)
        return Response(data)

class CreateFolderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'detail': 'El nombre de la carpeta es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)
        parent_id = request.data.get('parent_id')

        service = GoogleDriveService()
        folder = service.create_folder(name=name, parent_id=parent_id, user=request.user)
        return Response(DriveFolderSerializer(folder).data, status=status.HTTP_201_CREATED)

class CreateDocumentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get('name', '').strip()
        doc_type = request.data.get('type', 'doc').strip()
        folder_id = request.data.get('folder_id')

        if not name:
            return Response({'detail': 'El nombre del archivo es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        service = GoogleDriveService()
        if doc_type == 'sheet':
            file_obj = service.create_sheet(name=name, folder_id=folder_id, user=request.user)
        else:
            file_obj = service.create_doc(name=name, folder_id=folder_id, user=request.user)

        return Response(DriveFileSerializer(file_obj).data, status=status.HTTP_201_CREATED)

class UploadFileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No se recibió ningún archivo para cargar.'}, status=status.HTTP_400_BAD_REQUEST)

        folder_id = request.data.get('folder_id')
        folder = DriveFolder.objects.filter(id=folder_id).first() if folder_id else None

        file_obj = DriveFile.objects.create(
            name=uploaded_file.name,
            mime_type=uploaded_file.content_type or 'application/octet-stream',
            size_bytes=uploaded_file.size,
            folder=folder,
            local_file=uploaded_file,
            owner_name=request.user.full_name,
            owner_email=request.user.email,
            created_by=request.user
        )
        return Response(DriveFileSerializer(file_obj).data, status=status.HTTP_201_CREATED)

class FileActionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        """Rename or move file"""
        file_obj = get_object_or_404(DriveFile, pk=pk)
        
        if 'name' in request.data:
            file_obj.name = request.data['name'].strip()
        if 'folder_id' in request.data:
            new_folder_id = request.data['folder_id']
            file_obj.folder = DriveFolder.objects.filter(id=new_folder_id).first() if new_folder_id else None
        
        file_obj.last_modified_by = request.user
        file_obj.save()
        return Response(DriveFileSerializer(file_obj).data)

    def delete(self, request, pk):
        """Send file to trash or delete"""
        file_obj = get_object_or_404(DriveFile, pk=pk)
        file_obj.is_trashed = True
        file_obj.save(update_fields=['is_trashed'])
        return Response({'message': 'Archivo enviado a la papelera correctamente.'})

class FolderActionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        """Rename or move folder"""
        folder = get_object_or_404(DriveFolder, pk=pk)
        if 'name' in request.data:
            folder.name = request.data['name'].strip()
        if 'parent_id' in request.data:
            new_parent_id = request.data['parent_id']
            folder.parent = DriveFolder.objects.filter(id=new_parent_id).first() if new_parent_id else None
        folder.save()
        return Response(DriveFolderSerializer(folder).data)

    def delete(self, request, pk):
        folder = get_object_or_404(DriveFolder, pk=pk)
        folder.is_trashed = True
        folder.save(update_fields=['is_trashed'])
        return Response({'message': 'Carpeta enviada a la papelera correctamente.'})

class DocContentView(views.APIView):
    """
    Embedded Google Docs editor content endpoint
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        file_obj = get_object_or_404(DriveFile, pk=pk, mime_type=DriveFile.MIME_DOC)
        return Response({
            'id': file_obj.id,
            'name': file_obj.name,
            'raw_html': file_obj.raw_html,
            'updated_at': file_obj.updated_at
        })

    def put(self, request, pk):
        file_obj = get_object_or_404(DriveFile, pk=pk, mime_type=DriveFile.MIME_DOC)
        raw_html = request.data.get('raw_html', '')
        file_obj.raw_html = raw_html
        file_obj.last_modified_by = request.user
        file_obj.save()
        return Response({'message': 'Documento guardado con éxito.', 'updated_at': file_obj.updated_at})
