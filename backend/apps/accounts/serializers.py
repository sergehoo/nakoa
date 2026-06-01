from rest_framework import serializers

from .models import User, UserAddress, UserDevice, UserPreferences


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "phone", "first_name", "last_name", "full_name",
            "primary_role", "avatar", "is_email_verified", "is_phone_verified",
            "two_factor_enabled", "kyc_level", "country", "locale", "timezone",
            "preferred_currency", "created_at",
        ]
        read_only_fields = [
            "id", "primary_role", "is_email_verified", "is_phone_verified",
            "two_factor_enabled", "kyc_level", "created_at",
        ]


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = "__all__"
        read_only_fields = ["id", "user", "created_at", "updated_at", "deleted_at"]


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        exclude = ["user", "deleted_at", "created_by", "updated_by"]


class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDevice
        fields = ["id", "platform", "fcm_token", "name", "last_seen_at", "created_at"]
        read_only_fields = ["id", "created_at"]
