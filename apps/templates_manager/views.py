from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import DocumentTemplate, TemplateVersion
from .serializers import DocumentTemplateSerializer, TemplateVersionSerializer
from apps.dynamic_fields.models import DynamicField
from apps.roles.permissions import HasModulePermission

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all().prefetch_related('fields', 'versions').order_by('-id')
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        template = serializer.save(created_by=self.request.user)
        # Create initial version 1
        TemplateVersion.objects.create(
            template=template,
            version_number=1,
            google_doc_id=template.google_doc_id,
            naming_pattern=template.naming_pattern,
            changelog="Versión inicial creada",
            content_snapshot=template.content_preview,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        source = self.get_object()
        with transaction.atomic():
            new_template = DocumentTemplate.objects.create(
                nombre=f"{source.nombre} (Copia)",
                descripcion=f"Copia creada a partir de {source.nombre}",
                tipo=source.tipo,
                google_doc_id=source.google_doc_id,
                drive_id=source.drive_id,
                target_folder_id=source.target_folder_id,
                target_folder_name=source.target_folder_name,
                naming_pattern=source.naming_pattern,
                is_active=True,
                version=1,
                content_preview=source.content_preview,
                created_by=request.user
            )

            # Copy all dynamic fields
            source_fields = source.fields.all()
            for f in source_fields:
                DynamicField.objects.create(
                    template=new_template,
                    name=f.name,
                    identifier=f.identifier,
                    field_type=f.field_type,
                    description=f.description,
                    placeholder=f.placeholder,
                    default_value=f.default_value,
                    is_required=f.is_required,
                    min_length=f.min_length,
                    max_length=f.max_length,
                    min_value=f.min_value,
                    max_value=f.max_value,
                    options=f.options,
                    order=f.order,
                    section=f.section,
                    width=f.width,
                    visibility_conditions=f.visibility_conditions,
                    sheets_column=f.sheets_column,
                    docs_tag=f.docs_tag
                )

            TemplateVersion.objects.create(
                template=new_template,
                version_number=1,
                google_doc_id=new_template.google_doc_id,
                naming_pattern=new_template.naming_pattern,
                changelog=f"Copia duplicada de {source.nombre}",
                content_snapshot=new_template.content_preview,
                created_by=request.user
            )

        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        template = self.get_object()
        template.is_active = not template.is_active
        template.save(update_fields=['is_active'])
        return Response({
            'message': f"Plantilla {'activada' if template.is_active else 'desactivada'} exitosamente.",
            'is_active': template.is_active
        })

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        template = self.get_object()
        versions = template.versions.all().order_by('-version_number')
        serializer = TemplateVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        template = self.get_object()
        changelog = request.data.get('changelog', 'Actualización de plantilla')
        new_version_num = template.version + 1

        template.version = new_version_num
        if 'naming_pattern' in request.data:
            template.naming_pattern = request.data['naming_pattern']
        if 'content_preview' in request.data:
            template.content_preview = request.data['content_preview']
        template.save()

        version_record = TemplateVersion.objects.create(
            template=template,
            version_number=new_version_num,
            google_doc_id=template.google_doc_id,
            naming_pattern=template.naming_pattern,
            changelog=changelog,
            content_snapshot=template.content_preview,
            created_by=request.user
        )
        return Response(TemplateVersionSerializer(version_record).data, status=status.HTTP_201_CREATED)
