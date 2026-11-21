from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, MeView, ProfileUpdateView, ChangePasswordView, UsersViewSet
)

router = DefaultRouter()
router.register(r'users', UsersViewSet, basename='users-management')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('profile/', ProfileUpdateView.as_view(), name='auth-profile-update'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('', include(router.urls)),
]
