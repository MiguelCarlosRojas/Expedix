from rest_framework import serializers
from .models import User
from apps.roles.serializers import RoleSerializer
from apps.roles.models import Permission

class UserSerializer(serializers.ModelSerializer):
    role_details = RoleSerializer(source='role', read_only=True)
    full_name = serializers.ReadOnlyField()
    avatar_display = serializers.SerializerMethodField()
    permissions_list = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'job_title', 'avatar', 'avatar_url', 'avatar_display',
            'role', 'role_details', 'permissions_list',
            'is_active', 'is_staff', 'is_superuser',
            'last_login', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'updated_by', 'updated_by_name'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_avatar_display(self, obj):
        return obj.get_avatar_url()

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def get_updated_by_name(self, obj):
        return obj.updated_by.full_name if obj.updated_by else None

    def get_permissions_list(self, obj):
        if obj.is_superuser:
            return list(Permission.objects.values_list('codename', flat=True))
        if obj.role:
            return list(obj.role.role_permissions.values_list('permission__codename', flat=True))
        return []

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'phone', 'job_title', 'role', 'is_active'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user.created_by = request.user
        user.save()
        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'email', 'phone', 'job_title', 'avatar_url']

    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def validate_email(self, value):
        user = self.context['request'].user
        if value and User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
