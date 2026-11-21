from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, VAPIDPublicKeyView, PushSubscribeView

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('vapid-public-key/', VAPIDPublicKeyView.as_view(), name='vapid-key'),
    path('push-subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
    path('', include(router.urls)),
]
