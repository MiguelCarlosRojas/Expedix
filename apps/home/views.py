from rest_framework import views, permissions
from rest_framework.response import Response
from apps.roles.permissions import user_has_permission

class ShortcutsView(views.APIView):
    """
    Returns EXCLUSIVELY direct shortcut cards filtered by user permissions.
    Zero stats, zero graphs, zero recent activity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        all_shortcuts = [
            {
                'id': 'crear-expediente',
                'title': 'Crear expediente',
                'description': 'Iniciar un nuevo expediente electrónico administrativo con carga de datos.',
                'path': '/app/documentos?action=new',
                'icon': 'IconFolderPlus',
                'color': 'blue',
                'module': 'documentos',
                'action': 'create',
            },
            {
                'id': 'generar-documento',
                'title': 'Generar documento',
                'description': 'Procesar y compilar documentos oficiales a partir de plantillas maestras y datos.',
                'path': '/app/documentos?action=generate',
                'icon': 'IconFileSpark',
                'color': 'teal',
                'module': 'documentos',
                'action': 'generate',
            },
            {
                'id': 'consultar-documentos',
                'title': 'Consultar documentos',
                'description': 'Explorar, filtrar y descargar el historial completo de expedientes y archivos emitidos.',
                'path': '/app/documentos',
                'icon': 'IconFiles',
                'color': 'indigo',
                'module': 'documentos',
                'action': 'view',
            },
            {
                'id': 'administrar-plantillas',
                'title': 'Administrar plantillas',
                'description': 'Gestionar plantillas maestras de Google Docs, versiones y constructor de campos.',
                'path': '/app/documentos?tab=templates',
                'icon': 'IconTemplate',
                'color': 'grape',
                'module': 'documentos',
                'action': 'admin',
            },
            {
                'id': 'administrar-drives',
                'title': 'Administrar Drives',
                'description': 'Acceso al explorador integrado de Google Drive, carpetas y hojas de cálculo Univer.',
                'path': '/app/drives',
                'icon': 'IconBrandGoogleDrive',
                'color': 'green',
                'module': 'drives',
                'action': 'view',
            },
            {
                'id': 'consultar-reportes',
                'title': 'Consultar reportes',
                'description': 'Ver métricas ejecutivas, productividad, errores y almacenamiento con exportación.',
                'path': '/app/reportes',
                'icon': 'IconReportAnalytics',
                'color': 'cyan',
                'module': 'reportes',
                'action': 'view',
            },
            {
                'id': 'administrar-empresa',
                'title': 'Administrar empresa',
                'description': 'Configuración de datos institucionales, razón social, prefijos y numeración.',
                'path': '/app/administracion',
                'icon': 'IconBuildingSkyscraper',
                'color': 'orange',
                'module': 'administracion',
                'action': 'view',
            },
            {
                'id': 'administrar-usuarios',
                'title': 'Administrar usuarios',
                'description': 'Gestión de cuentas de usuarios, estados, contraseñas y asignación de roles.',
                'path': '/app/usuarios',
                'icon': 'IconUsers',
                'color': 'violet',
                'module': 'usuarios',
                'action': 'view',
            },
            {
                'id': 'administrar-roles-permisos',
                'title': 'Administrar roles y permisos',
                'description': 'Configurar matriz de privilegios y accesos de seguridad para cada perfil del sistema.',
                'path': '/app/roles',
                'icon': 'IconShieldLock',
                'color': 'red',
                'module': 'roles',
                'action': 'view',
            },
        ]

        allowed_shortcuts = []
        for card in all_shortcuts:
            if user.is_superuser:
                allowed_shortcuts.append(card)
            elif user_has_permission(user, card['module'], card['action']):
                allowed_shortcuts.append(card)

        return Response({'shortcuts': allowed_shortcuts})
