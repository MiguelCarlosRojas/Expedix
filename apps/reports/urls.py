from django.urls import path
from .views import ReportDetailView, ReportExportView

urlpatterns = [
    path('<str:report_id>/export/', ReportExportView.as_view(), name='report-export'),
    path('<str:report_id>/', ReportDetailView.as_view(), name='report-detail'),
]
