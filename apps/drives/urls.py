from django.urls import path
from .views import (
    DriveExplorerView, CreateFolderView, CreateDocumentView,
    UploadFileView, FileActionView, FolderActionView, DocContentView
)

urlpatterns = [
    path('explorer/', DriveExplorerView.as_view(), name='drive-explorer'),
    path('create-folder/', CreateFolderView.as_view(), name='drive-create-folder'),
    path('create-document/', CreateDocumentView.as_view(), name='drive-create-doc'),
    path('upload/', UploadFileView.as_view(), name='drive-upload-file'),
    path('files/<int:pk>/', FileActionView.as_view(), name='drive-file-actions'),
    path('folders/<int:pk>/', FolderActionView.as_view(), name='drive-folder-actions'),
    path('docs/<int:pk>/content/', DocContentView.as_view(), name='drive-doc-content'),
]
