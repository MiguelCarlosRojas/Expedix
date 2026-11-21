from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Role, Permission, RolePermission
from .serializers import RoleSerializer, PermissionSerializer
from .permissions import HasModulePermission

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    permission_module = 'roles'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'permissions_list']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), HasModulePermission('roles', 'admin')]

    @action(detail=False, methods=['get'])
    def permissions_list(self, request):
        perms = Permission.objects.all().order_by('module', 'id')
        serializer = PermissionSerializer(perms, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        source_role = self.get_object()
        new_name = request.data.get('name', f"{source_role.name} (Copia)")
        new_code = request.data.get('code', f"{source_role.code}_COPIA_{Role.objects.count() + 1}")

        new_role = Role.objects.create(
            name=new_name,
            code=new_code,
            description=f"Copia creada a partir de {source_role.name}",
            is_active=True,
            is_system=False,
        )

        source_perms = source_role.role_permissions.all()
        RolePermission.objects.bulk_create([
            RolePermission(role=new_role, permission=rp.permission)
            for rp in source_perms
        ])

        return Response(RoleSerializer(new_role).data, status=status.HTTP_201_CREATED)
