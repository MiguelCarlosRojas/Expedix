from django.urls import path
from .views import CompanyConfigView

urlpatterns = [
    path('', CompanyConfigView.as_view(), name='company-config'),
]
