import os
import uuid
from datetime import datetime
from django.conf import settings
from .models import DriveFolder, DriveFile

class GoogleDriveService:
    def __init__(self):
        self.service_account_path = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', '')
        self.client = None
        self._init_client()

    def _init_client(self):
        """Attempts to initialize Google Drive API v3 client if credentials exist"""
        if self.service_account_path and os.path.exists(self.service_account_path):
            try:
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                scopes = ['https://www.googleapis.com/auth/drive']
                credentials = service_account.Credentials.from_service_account_file(
                    self.service_account_path, scopes=scopes
                )
                self.client = build('drive', 'v3', credentials=credentials)
            except Exception:
                self.client = None

    def ensure_default_hierarchy(self, user=None):
        """Seeds standard enterprise folders and sample files if database is fresh"""
        if not DriveFolder.objects.exists():
            root_folders = [
                ("Expedientes Emitidos 2026", "expedientes_2026"),
                ("Plantillas Maestras Corporativas", "plantillas_drive"),
                ("Comprobantes y Pagos Proveedores", "pagos_drive"),
                ("Hojas de Control y Liquidación", "control_drive"),
            ]
            for folder_name, folder_id in root_folders:
                folder = DriveFolder.objects.create(
                    google_folder_id=f"gfolder_{folder_id}",
                    name=folder_name,
                    created_by=user
                )

                # Add sample files inside
                if folder_name == "Hojas de Control y Liquidación":
                    # Sample Univer / Google Sheet
                    DriveFile.objects.create(
                        google_file_id=f"gsheet_control_{uuid.uuid4().hex[:8]}",
                        name="Control_Liquidaciones_Proveedores_2026",
                        mime_type=DriveFile.MIME_SHEET,
                        size_bytes=45200,
                        folder=folder,
                        owner_name=user.full_name if user else "Administrador",
                        owner_email=user.email if user else "admin@empresa.com",
                        web_view_link="https://docs.google.com/spreadsheets/d/sample/edit",
                        content_data={
                            'sheets': [
                                {
                                    'name': 'Liquidaciones 2026',
                                    'rowCount': 50,
                                    'columnCount': 10,
                                    'cellData': {
                                        '0': {
                                            '0': {'v': 'EXPEDIENTE', 's': {'bl': 1, 'bg': {'rgb': '#0b7285'}, 'cl': {'rgb': '#ffffff'}}},
                                            '1': {'v': 'PROVEEDOR', 's': {'bl': 1, 'bg': {'rgb': '#0b7285'}, 'cl': {'rgb': '#ffffff'}}},
                                            '2': {'v': 'RUC', 's': {'bl': 1, 'bg': {'rgb': '#0b7285'}, 'cl': {'rgb': '#ffffff'}}},
                                            '3': {'v': 'MONTO', 's': {'bl': 1, 'bg': {'rgb': '#0b7285'}, 'cl': {'rgb': '#ffffff'}}},
                                            '4': {'v': 'ESTADO', 's': {'bl': 1, 'bg': {'rgb': '#0b7285'}, 'cl': {'rgb': '#ffffff'}}},
                                        },
                                        '1': {
                                            '0': {'v': 'EXP-001001'},
                                            '1': {'v': 'Consultores Andinos S.A.'},
                                            '2': {'v': '20123456789'},
                                            '3': {'v': 15000},
                                            '4': {'v': 'GENERADO'},
                                        },
                                        '2': {
                                            '0': {'v': 'EXP-001002'},
                                            '1': {'v': 'Servicios Globales Tech SAC'},
                                            '2': {'v': '20491823719'},
                                            '3': {'v': 8450},
                                            '4': {'v': 'GENERADO'},
                                        }
                                    }
                                }
                            ]
                        },
                        created_by=user
                    )
                elif folder_name == "Plantillas Maestras Corporativas":
                    # Sample Google Doc
                    DriveFile.objects.create(
                        google_file_id=f"gdoc_acta_{uuid.uuid4().hex[:8]}",
                        name="Plantilla_Acta_Conformidad_Maestra",
                        mime_type=DriveFile.MIME_DOC,
                        size_bytes=28900,
                        folder=folder,
                        owner_name=user.full_name if user else "Administrador",
                        owner_email=user.email if user else "admin@empresa.com",
                        raw_html="<h2>ACTA DE CONFORMIDAD MAESTRA</h2><p>Contenido base de la plantilla corporativa.</p>",
                        created_by=user
                    )

    def list_contents(self, folder_id=None, search=None, mime_filter=None):
        """Lists folders and files under folder_id with filtering and search"""
        folder = None
        if folder_id and folder_id not in ['root', 'null', 'None']:
            folder = DriveFolder.objects.filter(id=folder_id, is_trashed=False).first()

        folders_qs = DriveFolder.objects.filter(parent=folder, is_trashed=False)
        files_qs = DriveFile.objects.filter(folder=folder, is_trashed=False)

        if search:
            folders_qs = folders_qs.filter(name__icontains=search)
            files_qs = files_qs.filter(name__icontains=search)

        if mime_filter:
            if mime_filter == 'docs':
                files_qs = files_qs.filter(mime_type=DriveFile.MIME_DOC)
            elif mime_filter == 'sheets':
                files_qs = files_qs.filter(mime_type=DriveFile.MIME_SHEET)
            elif mime_filter == 'pdf':
                files_qs = files_qs.filter(mime_type=DriveFile.MIME_PDF)

        breadcrumbs = folder.get_breadcrumbs() if folder else [{'id': None, 'name': 'Mi Unidad Drive'}]

        return {
            'current_folder': {
                'id': folder.id,
                'name': folder.name,
                'google_folder_id': folder.google_folder_id
            } if folder else {'id': None, 'name': 'Mi Unidad Drive'},
            'breadcrumbs': breadcrumbs,
            'folders': [
                {
                    'id': f.id,
                    'name': f.name,
                    'google_folder_id': f.google_folder_id,
                    'items_count': f.files.count() + f.children.count(),
                    'updated_at': f.updated_at.strftime('%Y-%m-%d %H:%M'),
                    'is_folder': True
                } for f in folders_qs
            ],
            'files': [
                {
                    'id': fl.id,
                    'name': fl.name,
                    'google_file_id': fl.google_file_id,
                    'mime_type': fl.mime_type,
                    'size': fl.human_size,
                    'size_bytes': fl.size_bytes,
                    'owner_name': fl.owner_name,
                    'updated_at': fl.updated_at.strftime('%Y-%m-%d %H:%M'),
                    'web_view_link': fl.web_view_link,
                    'is_folder': False
                } for fl in files_qs
            ]
        }

    def create_folder(self, name, parent_id=None, user=None):
        parent_folder = None
        if parent_id and parent_id not in ['root', 'null', 'None']:
            parent_folder = DriveFolder.objects.filter(id=parent_id).first()

        folder = DriveFolder.objects.create(
            google_folder_id=f"gfolder_{uuid.uuid4().hex[:12]}",
            name=name.strip(),
            parent=parent_folder,
            created_by=user
        )
        return folder

    def create_doc(self, name, folder_id=None, user=None):
        folder = None
        if folder_id and folder_id not in ['root', 'null', 'None']:
            folder = DriveFolder.objects.filter(id=folder_id).first()

        doc_file = DriveFile.objects.create(
            google_file_id=f"gdoc_{uuid.uuid4().hex[:12]}",
            name=name.strip(),
            mime_type=DriveFile.MIME_DOC,
            folder=folder,
            owner_name=user.full_name if user else "Administrador",
            owner_email=user.email if user else "",
            raw_html=f"<h2>{name}</h2><p>Documento de Google Docs creado desde dbPayOut.</p>",
            web_view_link=f"https://docs.google.com/document/d/gdoc_{uuid.uuid4().hex[:12]}/edit",
            created_by=user
        )
        return doc_file

    def create_sheet(self, name, folder_id=None, user=None):
        folder = None
        if folder_id and folder_id not in ['root', 'null', 'None']:
            folder = DriveFolder.objects.filter(id=folder_id).first()

        sheet_file = DriveFile.objects.create(
            google_file_id=f"gsheet_{uuid.uuid4().hex[:12]}",
            name=name.strip(),
            mime_type=DriveFile.MIME_SHEET,
            folder=folder,
            owner_name=user.full_name if user else "Administrador",
            owner_email=user.email if user else "",
            content_data={
                'sheets': [
                    {
                        'name': 'Hoja 1',
                        'rowCount': 40,
                        'columnCount': 10,
                        'cellData': {
                            '0': {
                                '0': {'v': 'Columna 1', 's': {'bl': 1}},
                                '1': {'v': 'Columna 2', 's': {'bl': 1}},
                                '2': {'v': 'Columna 3', 's': {'bl': 1}},
                            }
                        }
                    }
                ]
            },
            web_view_link=f"https://docs.google.com/spreadsheets/d/gsheet_{uuid.uuid4().hex[:12]}/edit",
            created_by=user
        )
        return sheet_file
