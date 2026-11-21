from django.urls import path
from .views import SpreadsheetDataView, SaveSpreadsheetView

urlpatterns = [
    path('<int:file_id>/data/', SpreadsheetDataView.as_view(), name='spreadsheet-data'),
    path('<int:file_id>/save/', SaveSpreadsheetView.as_view(), name='spreadsheet-save'),
]
