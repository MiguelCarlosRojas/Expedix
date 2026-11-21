from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.roles.models import Role, Permission, RolePermission
from apps.company.models import Company
from apps.templates_manager.models import DocumentTemplate, TemplateVersion
from apps.dynamic_fields.models import DynamicField

User = get_user_model()

class Command(BaseCommand):
    help = "Poblar el sistema con Roles, Permisos, Empresa, Superusuario y 4 Plantillas Maestras Profesionales"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando inicialización de datos base...")

        # 1. Permisos
        modules = [
            ('inicio', 'Inicio'),
            ('dashboard', 'Dashboard'),
            ('documentos', 'Documentos'),
            ('drives', 'Drives'),
            ('reportes', 'Reportes'),
            ('administracion', 'Administración'),
            ('roles', 'Roles y Permisos'),
            ('usuarios', 'Usuarios'),
            ('notificaciones', 'Notificaciones'),
        ]
        actions = [
            ('view', 'Visualizar'),
            ('create', 'Crear'),
            ('edit', 'Editar'),
            ('delete', 'Eliminar'),
            ('generate', 'Generar'),
            ('download', 'Descargar'),
            ('export', 'Exportar'),
            ('admin', 'Administrar'),
        ]

        all_perms = []
        for mod_code, mod_name in modules:
            for act_code, act_name in actions:
                codename = f"{mod_code}_{act_code}"
                name = f"{act_name} en {mod_name}"
                p, _ = Permission.objects.get_or_create(
                    module=mod_code,
                    action=act_code,
                    defaults={'codename': codename, 'name': name, 'description': f"Permite {act_name.lower()} en {mod_name}"}
                )
                all_perms.append(p)
        self.stdout.write(f"Permisos verificados: {len(all_perms)}")

        # 2. Roles
        roles_def = [
            ('SUPERADMINISTRADOR', 'Superadministrador', 'Control total y acceso irrestricto a todos los módulos y operaciones del sistema.', True),
            ('ADMINISTRADOR', 'Administrador', 'Gestión operativa y administrativa completa del sistema.', False),
            ('OPERADOR', 'Operador de Expedientes', 'Creación, edición y generación de expedientes, documentos y drives.', False),
            ('CONSULTA', 'Usuario de Consulta', 'Visualización, búsqueda y descarga de expedientes y reportes.', False),
            ('AUDITOR', 'Auditor de Procesos', 'Supervisión de trazabilidad, registros inmutables de auditoría y reportes.', False),
        ]

        created_roles = {}
        for code, name, desc, is_sys in roles_def:
            role, _ = Role.objects.get_or_create(
                code=code,
                defaults={'name': name, 'description': desc, 'is_active': True, 'is_system': is_sys}
            )
            created_roles[code] = role

        # Asignar permisos por rol
        super_role = created_roles['SUPERADMINISTRADOR']
        RolePermission.objects.filter(role=super_role).delete()
        RolePermission.objects.bulk_create([RolePermission(role=super_role, permission=p) for p in all_perms])

        admin_role = created_roles['ADMINISTRADOR']
        admin_perms = [p for p in all_perms if not (p.module in ['roles'] and p.action in ['delete'])]
        RolePermission.objects.filter(role=admin_role).delete()
        RolePermission.objects.bulk_create([RolePermission(role=admin_role, permission=p) for p in admin_perms])

        operador_role = created_roles['OPERADOR']
        operador_perms = [p for p in all_perms if (
            p.action == 'view' or
            (p.module == 'documentos' and p.action in ['create', 'edit', 'generate', 'download', 'export']) or
            (p.module == 'drives' and p.action in ['create', 'edit', 'download', 'upload'])
        )]
        RolePermission.objects.filter(role=operador_role).delete()
        RolePermission.objects.bulk_create([RolePermission(role=operador_role, permission=p) for p in operador_perms])

        consulta_role = created_roles['CONSULTA']
        consulta_perms = [p for p in all_perms if p.action in ['view', 'download', 'export']]
        RolePermission.objects.filter(role=consulta_role).delete()
        RolePermission.objects.bulk_create([RolePermission(role=consulta_role, permission=p) for p in consulta_perms])

        auditor_role = created_roles['AUDITOR']
        auditor_perms = [p for p in all_perms if p.action in ['view', 'export']]
        RolePermission.objects.filter(role=auditor_role).delete()
        RolePermission.objects.bulk_create([RolePermission(role=auditor_role, permission=p) for p in auditor_perms])

        # 3. Empresa
        company, _ = Company.objects.get_or_create(
            ruc="20601234567",
            defaults={
                'razon_social': "CORPORACIÓN EMPRESARIAL DE SERVICIOS S.A.C.",
                'nombre_comercial': "EXPEDIENTES PRO CORP",
                'direccion': "Av. República de Panamá 3418, San Isidro, Lima, Perú",
                'telefono': "+51 (01) 710-8900",
                'correo': "contacto@expedientescorp.com",
                'pagina_web': "https://www.expedientescorp.com",
                'encabezado_documental': "SISTEMA CENTRALIZADO DE GESTIÓN DOCUMENTAL Y EXPEDIENTES ELECTRÓNICOS",
                'pie_pagina_documental': "Documento oficial generado con valor probatorio digital conforme a ley.",
                'prefijo_expedientes': "EXP-",
                'correlativo_actual': 1000,
                'zona_horaria': "America/Lima"
            }
        )

        # 4. Superusuario
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@expedientescorp.com',
                'first_name': 'Administrador',
                'last_name': 'Principal',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'role': super_role,
                'job_title': 'Director de TI y Transformación Digital',
                'phone': '+51 987 654 321'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write("Superusuario 'admin' creado con contraseña 'admin123'.")
        else:
            admin_user.role = super_role
            admin_user.save()

        # 5. Las 4 Plantillas Maestras Profesionales
        templates_specs = [
            {
                'nombre': "Acta de Conformidad de Servicio",
                'tipo': "ACTA",
                'descripcion': "Documento oficial que valida la recepción conforme de prestaciones, bienes o servicios contratados para trámite de pago.",
                'google_doc_id': "1DocsSampleActaConformidadId998877",
                'naming_pattern': "ACTA_{{NUMERO_EXPEDIENTE}}_{{RAZON_SOCIAL_PROVEEDOR}}",
                'preview_html': """
                <div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #1a1a1a;">
                    <div style="text-align: center; border-bottom: 2px solid #0b7285; padding-bottom: 12px; margin-bottom: 25px;">
                        <h2 style="color: #0b7285; margin: 0; text-transform: uppercase;">{{EMPRESA_RAZON_SOCIAL}}</h2>
                        <p style="margin: 4px 0; font-size: 13px; color: #555;">RUC: {{EMPRESA_RUC}} | {{EMPRESA_DIRECCION}}</p>
                        <h3 style="margin-top: 15px; letter-spacing: 1px;">ACTA DE CONFORMIDAD DE PRESTACIÓN DE SERVICIOS N° {{NUMERO_EXPEDIENTE}}</h3>
                    </div>
                    <p>En la ciudad de Lima, a los <strong>{{FECHA_EMISION}}</strong>, el área usuaria correspondiente emite la presente conformidad respecto al servicio contratado conforme al siguiente detalle:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f1f3f5;"><th style="border: 1px solid #ced4da; padding: 8px; text-align: left;">Proveedor / Razón Social:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{RAZON_SOCIAL_PROVEEDOR}}</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px; text-align: left;">RUC del Proveedor:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{RUC_PROVEEDOR}}</td></tr>
                        <tr style="background: #f1f3f5;"><th style="border: 1px solid #ced4da; padding: 8px; text-align: left;">Orden de Servicio / Contrato:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{NUMERO_ORDEN}}</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px; text-align: left;">Descripción del Servicio:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{DESCRIPCION_SERVICIO}}</td></tr>
                        <tr style="background: #f1f3f5;"><th style="border: 1px solid #ced4da; padding: 8px; text-align: left;">Monto Total Liquidado:</th><td style="border: 1px solid #ced4da; padding: 8px;"><strong>{{MONTO_TOTAL}}</strong></td></tr>
                    </table>
                    <div style="margin-top: 25px; padding: 15px; background: #e6fcf5; border-left: 4px solid #0ca678;">
                        <p style="margin: 0; font-weight: bold; color: #087f5b;">CONCLUSIÓN DE CONFORMIDAD:</p>
                        <p style="margin: 5px 0 0 0;">{{OBSERVACIONES_CONFORMIDAD}}</p>
                    </div>
                    <div style="margin-top: 60px; display: flex; justify-content: space-between; text-align: center;">
                        <div style="width: 45%; border-top: 1px solid #000; padding-top: 8px;"><strong>{{RESPONSABLE_AREA}}</strong><br>Responsable del Área Usuaria</div>
                        <div style="width: 45%; border-top: 1px solid #000; padding-top: 8px;"><strong>{{REPRESENTANTE_PROVEEDOR}}</strong><br>Representante del Proveedor</div>
                    </div>
                </div>
                """,
                'fields': [
                    ('RAZON_SOCIAL_PROVEEDOR', 'Razón Social Proveedor', 'text', 'Ej. Consultores Andinos S.A.', True, 'Datos del Proveedor', 'col-6', 'A', '{{RAZON_SOCIAL_PROVEEDOR}}'),
                    ('RUC_PROVEEDOR', 'RUC Proveedor', 'text', '20123456789', True, 'Datos del Proveedor', 'col-6', 'B', '{{RUC_PROVEEDOR}}'),
                    ('NUMERO_ORDEN', 'N° Orden de Servicio', 'text', 'OS-2026-0045', True, 'Datos Contractuales', 'col-6', 'C', '{{NUMERO_ORDEN}}'),
                    ('FECHA_EMISION', 'Fecha de Conformidad', 'date', '', True, 'Datos Contractuales', 'col-6', 'D', '{{FECHA_EMISION}}'),
                    ('MONTO_TOTAL', 'Monto Total Facturado', 'currency', 'S/ 15,000.00', True, 'Liquidación Financiera', 'col-6', 'E', '{{MONTO_TOTAL}}'),
                    ('DESCRIPCION_SERVICIO', 'Descripción Detallada del Servicio', 'textarea', 'Servicios de auditoría y soporte de infraestructura en nube.', True, 'Detalle Técnico', 'col-12', 'F', '{{DESCRIPCION_SERVICIO}}'),
                    ('OBSERVACIONES_CONFORMIDAD', 'Observaciones de Conformidad', 'textarea', 'El servicio fue prestado en su totalidad y a entera satisfacción según los términos de referencia.', False, 'Conclusión', 'col-12', 'G', '{{OBSERVACIONES_CONFORMIDAD}}'),
                    ('RESPONSABLE_AREA', 'Nombre del Responsable del Área', 'text', 'Ing. Carlos Mendoza Soto', True, 'Firmas', 'col-6', 'H', '{{RESPONSABLE_AREA}}'),
                    ('REPRESENTANTE_PROVEEDOR', 'Nombre Representante Legal Proveedor', 'text', 'Dra. María Elena Ramos', True, 'Firmas', 'col-6', 'I', '{{REPRESENTANTE_PROVEEDOR}}'),
                ]
            },
            {
                'nombre': "Solicitud y Autorización de Pago a Proveedor",
                'tipo': "SOLICITUD",
                'descripcion': "Expediente formal para requerimiento, autorización presupuestaria y desembolso a cuentas bancarias de terceros.",
                'google_doc_id': "1DocsSampleSolicitudPagoId112233",
                'naming_pattern': "SOLPAGO_{{NUMERO_EXPEDIENTE}}_{{PROVEEDOR}}",
                'preview_html': """
                <div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #1a1a1a;">
                    <div style="text-align: center; border-bottom: 2px solid #1971c2; padding-bottom: 12px; margin-bottom: 25px;">
                        <h2 style="color: #1971c2; margin: 0;">{{EMPRESA_RAZON_SOCIAL}}</h2>
                        <h3 style="margin-top: 10px;">SOLICITUD DE DESEMBOLSO Y ORDEN DE PAGO N° {{NUMERO_EXPEDIENTE}}</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><th style="border: 1px solid #ced4da; padding: 8px; width: 35%;">Beneficiario:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{PROVEEDOR}} (RUC: {{RUC_PROVEEDOR}})</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px;">Banco y N° de Cuenta / CCI:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{BANCO_DESTINO}} - CCI: {{CUENTA_CCI}}</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px;">Factura / Comprobante:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{NUMERO_FACTURA}}</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px;">Importe Neto a Pagar:</th><td style="border: 1px solid #ced4da; padding: 8px; font-weight: bold; color: #1864ab;">{{MONTO_PAGO}}</td></tr>
                        <tr><th style="border: 1px solid #ced4da; padding: 8px;">Concepto de Pago:</th><td style="border: 1px solid #ced4da; padding: 8px;">{{CONCEPTO_PAGO}}</td></tr>
                    </table>
                    <div style="margin-top: 50px; display: flex; justify-content: space-around; text-align: center;">
                        <div style="width: 40%; border-top: 1px solid #000; padding-top: 8px;"><strong>{{SOLICITADO_POR}}</strong><br>Solicitante / Área de Operaciones</div>
                        <div style="width: 40%; border-top: 1px solid #000; padding-top: 8px;"><strong>{{APROBADO_POR}}</strong><br>Gerencia de Administración y Finanzas</div>
                    </div>
                </div>
                """,
                'fields': [
                    ('PROVEEDOR', 'Beneficiario / Proveedor', 'text', 'Servicios Globales Tech SAC', True, 'Beneficiario', 'col-6', 'A', '{{PROVEEDOR}}'),
                    ('RUC_PROVEEDOR', 'RUC Beneficiario', 'text', '20491823719', True, 'Beneficiario', 'col-6', 'B', '{{RUC_PROVEEDOR}}'),
                    ('BANCO_DESTINO', 'Entidad Bancaria', 'select', '', True, 'Cuentas Bancarias', 'col-6', 'C', '{{BANCO_DESTINO}}'),
                    ('CUENTA_CCI', 'Código de Cuenta Interbancario (CCI)', 'text', '002-191-000123456789-54', True, 'Cuentas Bancarias', 'col-6', 'D', '{{CUENTA_CCI}}'),
                    ('NUMERO_FACTURA', 'N° Factura Electrónica', 'text', 'E001-4921', True, 'Comprobante', 'col-6', 'E', '{{NUMERO_FACTURA}}'),
                    ('MONTO_PAGO', 'Monto Neto Solicitado', 'currency', 'USD 8,450.00', True, 'Comprobante', 'col-6', 'F', '{{MONTO_PAGO}}'),
                    ('CONCEPTO_PAGO', 'Concepto y Justificación del Pago', 'textarea', 'Liquidación de cuota mensual por servicios de licenciamiento.', True, 'Justificación', 'col-12', 'G', '{{CONCEPTO_PAGO}}'),
                    ('SOLICITADO_POR', 'Nombre del Solicitante', 'text', 'Lic. Patricia Vega Luna', True, 'Autorizaciones', 'col-6', 'H', '{{SOLICITADO_POR}}'),
                    ('APROBADO_POR', 'Nombre de Quien Autoriza (Gerencia)', 'text', 'Econ. Roberto Vargas Prado', True, 'Autorizaciones', 'col-6', 'I', '{{APROBADO_POR}}'),
                ]
            },
            {
                'nombre': "Informe Técnico de Liquidación",
                'tipo': "INFORME",
                'descripcion': "Evaluación técnica integral del cumplimiento de metas, entregables de ingeniería y liquidación económica.",
                'google_doc_id': "1DocsSampleInformeTecnicoId445566",
                'naming_pattern': "INF_{{NUMERO_EXPEDIENTE}}_{{PROYECTO}}",
                'preview_html': """
                <div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6; color: #1a1a1a;">
                    <div style="border-bottom: 2px solid #2f9e44; padding-bottom: 12px; margin-bottom: 20px;">
                        <h2 style="color: #2f9e44; margin: 0;">{{EMPRESA_RAZON_SOCIAL}}</h2>
                        <h3 style="margin-top: 8px;">INFORME TÉCNICO DE LIQUIDACIÓN Y CIERRE N° {{NUMERO_EXPEDIENTE}}</h3>
                    </div>
                    <p><strong>A:</strong> {{DESTINATARIO_INFORME}}<br><strong>DE:</strong> {{AUTOR_INFORME}}<br><strong>PROYECTO:</strong> {{PROYECTO}}<br><strong>FECHA:</strong> {{FECHA_INFORME}}</p>
                    <hr style="border: 0; border-top: 1px solid #dee2e6; margin: 15px 0;">
                    <h4>1. ANTECEDENTES Y ALCANCE</h4>
                    <p>{{ANTECEDENTES}}</p>
                    <h4>2. DESARROLLO DE ENTREGABLES Y ACTIVIDADES</h4>
                    <p>{{ACTIVIDADES_REALIZADAS}}</p>
                    <h4>3. CONCLUSIONES Y RECOMENDACIÓN</h4>
                    <p>{{CONCLUSIONES}}</p>
                    <div style="margin-top: 40px; text-align: right;">
                        <p><strong>{{AUTOR_INFORME}}</strong><br>Especialista Técnico Responsable</p>
                    </div>
                </div>
                """,
                'fields': [
                    ('DESTINATARIO_INFORME', 'Para (Destinatario)', 'text', 'Comité de Dirección y Operaciones', True, 'Encabezado', 'col-6', 'A', '{{DESTINATARIO_INFORME}}'),
                    ('AUTOR_INFORME', 'De (Especialista Técnico)', 'text', 'Ing. David Salazar Huamán', True, 'Encabezado', 'col-6', 'B', '{{AUTOR_INFORME}}'),
                    ('PROYECTO', 'Nombre del Proyecto o Expediente', 'text', 'Modernización de Base de Datos y Automatización Cloud', True, 'Encabezado', 'col-6', 'C', '{{PROYECTO}}'),
                    ('FECHA_INFORME', 'Fecha del Informe', 'date', '', True, 'Encabezado', 'col-6', 'D', '{{FECHA_INFORME}}'),
                    ('ANTECEDENTES', 'Antecedentes y Alcance', 'textarea', 'En conformidad con el plan operativo anual...', True, 'Contenido Técnico', 'col-12', 'E', '{{ANTECEDENTES}}'),
                    ('ACTIVIDADES_REALIZADAS', 'Actividades Ejecutadas y Entregables', 'textarea', 'Se procedió a la migración, pruebas de carga y homologación...', True, 'Contenido Técnico', 'col-12', 'F', '{{ACTIVIDADES_REALIZADAS}}'),
                    ('CONCLUSIONES', 'Conclusiones y Dictamen', 'textarea', 'El proyecto culminó satisfactoriamente cumpliendo los indicadores de calidad.', True, 'Contenido Técnico', 'col-12', 'G', '{{CONCLUSIONES}}'),
                ]
            },
            {
                'nombre': "Constancia de Prestación y Entrega",
                'tipo': "CONSTANCIA",
                'descripcion': "Certificación formal emitida a contratistas o proveedores acreditando el desempeño favorable.",
                'google_doc_id': "1DocsSampleConstanciaPrestacionId778899",
                'naming_pattern': "CONSTANCIA_{{NUMERO_EXPEDIENTE}}_{{BENEFICIARIO}}",
                'preview_html': """
                <div style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; color: #1a1a1a; text-align: justify;">
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h2 style="color: #d6336c; margin: 0;">{{EMPRESA_RAZON_SOCIAL}}</h2>
                        <p style="font-size: 13px; color: #666;">RUC: {{EMPRESA_RUC}}</p>
                        <h3 style="letter-spacing: 2px; margin-top: 30px;">CONSTANCIA DE PRESTACIÓN N° {{NUMERO_EXPEDIENTE}}</h3>
                    </div>
                    <p>La Dirección de Administración y Gestión Humana de <strong>{{EMPRESA_RAZON_SOCIAL}}</strong>, por medio del presente documento hace constar que:</p>
                    <p style="text-align: center; font-size: 18px; font-weight: bold; margin: 25px 0; color: #343a40;">{{BENEFICIARIO}}</p>
                    <p>Identificado(a) con {{TIPO_DOCUMENTO_IDENTIDAD}} N° <strong>{{NUMERO_DOCUMENTO_IDENTIDAD}}</strong>, ha prestado servicios profesionales para nuestra institución desempeñando el cargo o servicio de <strong>{{CARGO_O_SERVICIO}}</strong> durante el período comprendido desde el <strong>{{FECHA_INICIO}}</strong> hasta el <strong>{{FECHA_FIN}}</strong>.</p>
                    <p>Durante su permanencia, demostró solvencia profesional, integridad, responsabilidad y cumplimiento de todas las obligaciones asignadas.</p>
                    <p>Se expide la presente constancia a solicitud de la parte interesada para los fines pertinentes que considere necesarios.</p>
                    <p style="margin-top: 30px;">Lima, {{FECHA_EMISION}}.</p>
                    <div style="margin-top: 60px; text-align: center;">
                        <div style="display: inline-block; width: 300px; border-top: 1px solid #000; padding-top: 8px;">
                            <strong>{{FIRMANTE_AUTORIZADO}}</strong><br>Gerencia General
                        </div>
                    </div>
                </div>
                """,
                'fields': [
                    ('BENEFICIARIO', 'Nombre Completo / Razón Social', 'text', 'Ing. Lucía Fernández Morales', True, 'Datos del Titular', 'col-6', 'A', '{{BENEFICIARIO}}'),
                    ('TIPO_DOCUMENTO_IDENTIDAD', 'Tipo de Documento', 'select', 'DNI', True, 'Datos del Titular', 'col-6', 'B', '{{TIPO_DOCUMENTO_IDENTIDAD}}'),
                    ('NUMERO_DOCUMENTO_IDENTIDAD', 'N° Documento de Identidad / RUC', 'text', '45892014', True, 'Datos del Titular', 'col-6', 'C', '{{NUMERO_DOCUMENTO_IDENTIDAD}}'),
                    ('CARGO_O_SERVICIO', 'Cargo o Servicio Prestado', 'text', 'Consultor Senior de Seguridad Informática', True, 'Período y Servicio', 'col-6', 'D', '{{CARGO_O_SERVICIO}}'),
                    ('FECHA_INICIO', 'Fecha de Inicio', 'date', '', True, 'Período y Servicio', 'col-6', 'E', '{{FECHA_INICIO}}'),
                    ('FECHA_FIN', 'Fecha de Culminación', 'date', '', True, 'Período y Servicio', 'col-6', 'F', '{{FECHA_FIN}}'),
                    ('FECHA_EMISION', 'Fecha de Emisión de Constancia', 'date', '', True, 'Emisión y Firma', 'col-6', 'G', '{{FECHA_EMISION}}'),
                    ('FIRMANTE_AUTORIZADO', 'Funcionario Autorizado que Firma', 'text', 'Dr. Guillermo Prado Alva', True, 'Emisión y Firma', 'col-6', 'H', '{{FIRMANTE_AUTORIZADO}}'),
                ]
            }
        ]

        for spec in templates_specs:
            t, t_created = DocumentTemplate.objects.get_or_create(
                nombre=spec['nombre'],
                defaults={
                    'tipo': spec['tipo'],
                    'descripcion': spec['descripcion'],
                    'google_doc_id': spec['google_doc_id'],
                    'naming_pattern': spec['naming_pattern'],
                    'content_preview': spec['preview_html'],
                    'created_by': admin_user,
                    'is_active': True,
                    'version': 1
                }
            )
            if t_created:
                TemplateVersion.objects.create(
                    template=t,
                    version_number=1,
                    google_doc_id=t.google_doc_id,
                    naming_pattern=t.naming_pattern,
                    changelog="Plantilla maestra inicial corporativa",
                    content_snapshot=t.content_preview,
                    created_by=admin_user
                )

                # Crear campos dinámicos
                for idx, field_tuple in enumerate(spec['fields']):
                    ident, name, f_type, placeholder, req, sec, width, sheet_col, doc_tag = field_tuple
                    opts = []
                    if f_type == 'select':
                        if ident == 'BANCO_DESTINO':
                            opts = [
                                {'label': 'Banco de Crédito del Perú (BCP)', 'value': 'BCP'},
                                {'label': 'BBVA Perú', 'value': 'BBVA'},
                                {'label': 'Interbank', 'value': 'INTERBANK'},
                                {'label': 'Scotiabank', 'value': 'SCOTIABANK'},
                                {'label': 'Banco de la Nación', 'value': 'BN'}
                            ]
                        elif ident == 'TIPO_DOCUMENTO_IDENTIDAD':
                            opts = [
                                {'label': 'Documento Nacional de Identidad (DNI)', 'value': 'DNI'},
                                {'label': 'Carné de Extranjería (CE)', 'value': 'CE'},
                                {'label': 'Pasaporte', 'value': 'PASAPORTE'},
                                {'label': 'RUC', 'value': 'RUC'}
                            ]
                    DynamicField.objects.create(
                        template=t,
                        name=name,
                        identifier=ident.lower(),
                        field_type=f_type,
                        placeholder=placeholder,
                        is_required=req,
                        order=idx,
                        section=sec,
                        width=width,
                        sheets_column=sheet_col,
                        docs_tag=doc_tag,
                        options=opts
                    )
            self.stdout.write(f"Plantilla verificada: {t.nombre}")

        self.stdout.write(self.style.SUCCESS("¡Inicialización de datos del sistema completada exitosamente!"))
