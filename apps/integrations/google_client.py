import os
from django.conf import settings

class GoogleWorkspaceClient:
    """
    Centralized Google Workspace API client wrapper (Drive v3, Docs v1, Sheets v4)
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_apis()
        return cls._instance

    def _init_apis(self):
        self.service_account_file = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', '')
        self.drive_service = None
        self.docs_service = None
        self.sheets_service = None

        if self.service_account_file and os.path.exists(self.service_account_file):
            try:
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                scopes = [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/documents',
                    'https://www.googleapis.com/auth/spreadsheets'
                ]
                credentials = service_account.Credentials.from_service_account_file(
                    self.service_account_file, scopes=scopes
                )
                self.drive_service = build('drive', 'v3', credentials=credentials)
                self.docs_service = build('docs', 'v1', credentials=credentials)
                self.sheets_service = build('sheets', 'v4', credentials=credentials)
            except Exception:
                pass
