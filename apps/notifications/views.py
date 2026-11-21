from rest_framework import views, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Notification, PushSubscription
from .serializers import NotificationSerializer, PushSubscriptionSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Notificación marcada como leída.', 'is_read': True})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'Todas las notificaciones han sido marcadas como leídas.'})

class VAPIDPublicKeyView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '')})

class PushSubscribeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            PushSubscription.objects.update_or_create(
                user=request.user,
                endpoint=serializer.validated_data['endpoint'],
                defaults={
                    'p256dh': serializer.validated_data['p256dh'],
                    'auth': serializer.validated_data['auth']
                }
            )
            return Response({'message': 'Suscripción Push registrada exitosamente.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
