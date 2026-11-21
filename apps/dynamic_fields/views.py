from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DynamicField
from .serializers import DynamicFieldSerializer

class DynamicFieldViewSet(viewsets.ModelViewSet):
    queryset = DynamicField.objects.all().order_by('order', 'id')
    serializer_class = DynamicFieldSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        template_id = self.request.query_params.get('template')
        if template_id:
            qs = qs.filter(template_id=template_id)
        return qs

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Accepts list of IDs with new order: [{'id': 1, 'order': 0}, {'id': 2, 'order': 1}]
        """
        items = request.data.get('items', [])
        for item in items:
            field_id = item.get('id')
            new_order = item.get('order', 0)
            DynamicField.objects.filter(id=field_id).update(order=new_order)
        return Response({'message': 'Orden de campos actualizado con éxito.'})
