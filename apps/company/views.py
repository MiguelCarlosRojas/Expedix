from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer
from apps.roles.permissions import HasModulePermission

class CompanyConfigView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = Company.objects.first()
        if not obj:
            obj = Company.objects.create(
                razon_social="CORPORACIÓN EMPRESARIAL DE SERVICIOS S.A.C.",
                nombre_comercial="EXPEDIENTES PRO CORP",
                ruc="20601234567",
                direccion="Av. República de Panamá 3418, San Isidro, Lima, Perú",
                telefono="+51 (01) 710-8900",
                correo="contacto@expedientescorp.com",
                pagina_web="https://www.expedientescorp.com",
                encabezado_documental="SISTEMA CENTRALIZADO DE GESTIÓN DOCUMENTAL Y EXPEDIENTES ELECTRÓNICOS",
                pie_pagina_documental="Documento Electrónico con valor oficial conforme a normativa de interoperabilidad digital.",
                prefijo_expedientes="EXP-",
                correlativo_actual=1000,
                zona_horaria="America/Lima"
            )
        return obj

    def get(self, request):
        company = self.get_object()
        serializer = CompanySerializer(company)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.is_superuser and not (request.user.role and request.user.role.code in ['SUPERADMINISTRADOR', 'ADMINISTRADOR']):
            return Response({'detail': 'No tienes permisos para modificar la configuración de la empresa.'}, status=status.HTTP_403_FORBIDDEN)
        company = self.get_object()
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)
