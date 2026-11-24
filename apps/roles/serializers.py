from rest_framework import serializers
from .models import Role, Permission, RolePermission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'module', 'action', 'codename', 'name', 'description']

class RoleSerializer(serializers.ModelSerializer):
    code = serializers.CharField(max_length=60, required=False)
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'description', 'is_active', 'is_system',
            'permissions', 'permission_ids', 'user_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_permissions(self, obj):
        perms = Permission.objects.filter(roles__role=obj)
        return PermissionSerializer(perms, many=True).data

    def get_user_count(self, obj):
        return obj.users.count() if hasattr(obj, 'users') else 0

    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        if not validated_data.get('code'):
            import re
            base_code = re.sub(r'[^A-Z0-9]', '_', validated_data.get('name', '').upper()).strip('_') or 'ROL'
            code = base_code
            counter = 1
            while Role.objects.filter(code=code).exists():
                code = f"{base_code}_{counter}"
                counter += 1
            validated_data['code'] = code
        role = Role.objects.create(**validated_data)
        if permission_ids:
            perms = Permission.objects.filter(id__in=permission_ids)
            RolePermission.objects.bulk_create([
                RolePermission(role=role, permission=p) for p in perms
            ])
        return role

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if permission_ids is not None:
            RolePermission.objects.filter(role=instance).delete()
            perms = Permission.objects.filter(id__in=permission_ids)
            RolePermission.objects.bulk_create([
                RolePermission(role=instance, permission=p) for p in perms
            ])
        return instance
