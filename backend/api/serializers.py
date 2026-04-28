from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile, Session

DEFAULT_SETTINGS = {
    'micSensitivity': 5,
    'gameDuration': 60,
    'soundEffects': True,
}


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    settings = serializers.JSONField(required=False)

    class Meta:
        model = Profile
        fields = ['email', 'child_name', 'settings']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        settings = {**DEFAULT_SETTINGS, **(data.get('settings') or {})}
        data['settings'] = settings
        return data


class SessionSerializer(serializers.ModelSerializer):
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'level', 'score', 'accuracy', 'correct', 'total', 'duration', 'created_at', 'timestamp']
        read_only_fields = ['id', 'created_at', 'timestamp']

    def get_timestamp(self, obj):
        return int(obj.created_at.timestamp() * 1000)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    child_name = serializers.CharField(max_length=80, required=False, allow_blank=True)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Account not found.'})

        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Invalid credentials.'})

        data = super().validate({'username': user.username, 'password': password})
        data['email'] = user.email
        return data
