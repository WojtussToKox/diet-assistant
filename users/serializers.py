from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role', 'first_name', 'last_name']

    def validate(self, data):
        
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords are not the same"})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'STANDARD'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data['user_id'] = self.user.id
        data['username'] = self.user.username
        data['role'] = self.user.role
        data['first_name'] = self.user.first_name

        return data