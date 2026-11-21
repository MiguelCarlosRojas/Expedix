from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/roles/', include('apps.roles.urls')),
    path('api/v1/company/', include('apps.company.urls')),
    path('api/v1/home/', include('apps.home.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/documents/', include('apps.documents.urls')),
    path('api/v1/templates/', include('apps.templates_manager.urls')),
    path('api/v1/fields/', include('apps.dynamic_fields.urls')),
    path('api/v1/drives/', include('apps.drives.urls')),
    path('api/v1/spreadsheets/', include('apps.spreadsheet_editor.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
