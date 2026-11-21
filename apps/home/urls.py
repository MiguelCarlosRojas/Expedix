from django.urls import path
from .views import ShortcutsView

urlpatterns = [
    path('shortcuts/', ShortcutsView.as_view(), name='home-shortcuts'),
]
