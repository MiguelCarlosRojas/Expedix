from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.db.models import Q
from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, ProfileUpdateSerializer, ChangePasswordSerializer
)
from apps.roles.permissions import HasModulePermission

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username_or_email or not password:
            return Response(
                {'detail': 'Debe ingresar su usuario o correo y contraseña.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login by email or username
        user_obj = User.objects.filter(
            Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)
        ).first()

        if user_obj:
            user = authenticate(request, username=user_obj.username, password=password)
        else:
            user = None

        if not user:
            return Response(
                {'detail': 'Credenciales inválidas. Verifique su usuario y contraseña.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Esta cuenta de usuario se encuentra desactivada. Contacte al administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        login(request, user)
        # Gestionar persistencia de sesión segura según "Recordar sesión en este equipo"
        remember = request.data.get('remember', True)
        if remember:
            request.session.set_expiry(1209600)  # 14 días (2 semanas)
        else:
            request.session.set_expiry(0)  # Expira inmediatamente al cerrar el navegador

        # Ensure CSRF cookie is set
        csrf_token = get_token(request)

        serializer = UserSerializer(user)
        return Response({
            'message': 'Inicio de sesión exitoso.',
            'user': serializer.data,
            'csrf_token': csrf_token
        }, status=status.HTTP_200_OK)

class LogoutView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
        response = Response({'message': 'Sesión cerrada exitosamente.'}, status=status.HTTP_200_OK)
        response.delete_cookie('sessionid')
        response.delete_cookie('csrftoken')
        return response

class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ProfileUpdateView(views.APIView):
    """
    Endpoint used by the ProfileModal in the header.
    Updates the authenticated user's profile and returns the fresh user representation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            full_user = UserSerializer(request.user)
            return Response({
                'message': 'Perfil actualizado correctamente.',
                'user': full_user.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {'current_password': ['La contraseña actual es incorrecta.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Contraseña actualizada con éxito.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UsersViewSet(viewsets.ModelViewSet):
    """
    CRUD management for Usuarios module with granular permissions.
    """
    queryset = User.objects.all().select_related('role', 'created_by', 'updated_by').order_by('-id')
    permission_classes = [permissions.IsAuthenticated]
    permission_module = 'usuarios'

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated(), HasModulePermission('usuarios', 'view')]
        if self.action == 'create':
            return [permissions.IsAuthenticated(), HasModulePermission('usuarios', 'create')]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), HasModulePermission('usuarios', 'edit')]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), HasModulePermission('usuarios', 'delete')]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': 'No puedes desactivar tu propia cuenta.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.updated_by = request.user
        user.save()
        return Response({
            'message': f"Usuario {'activado' if user.is_active else 'desactivado'} correctamente.",
            'is_active': user.is_active
        })

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password', '')
        if len(new_password) < 6:
            return Response({'detail': 'La contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.updated_by = request.user
        user.save()
        return Response({'message': f'Contraseña de {user.username} restablecida con éxito.'})
