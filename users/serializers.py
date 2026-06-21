from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from django.contrib.auth import get_user_model
from .models import User, DietitianRequest
from diets.services import DietCalculatorService

User = get_user_model()

class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role',
                  'is_staff', 'dietitian', 'height_cm', 'weight_kg', 'active_plan']

    def validate_active_plan(self, value):
        if value is None:
            return value

        if value.patient != self.instance:
            raise serializers.ValidationError("You cannot assign a plan that does not belong to you.")

        return value

    def get_daily_caloric_needs(self, obj):
        age = 30
        if hasattr(obj, 'date_of_birth') and obj.date_of_birth:
            from datetime import date
            today = date.today()
            age = today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))


        return DietCalculatorService.calculate_daily_caloric_needs(
            weight_kg=obj.weight_kg,
            height_cm=obj.height_cm,
            age=age,
            gender=getattr(obj, 'gender', 'M')
        )

class UserRegistrationSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role', 'first_name', 'last_name', 'height_cm', 'weight_kg']

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
            last_name=validated_data.get('last_name', ''),
            height_cm=validated_data.get('height_cm'),
            weight_kg=validated_data.get('weight_kg')
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

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'height_cm', 'weight_kg']
        
class DietitianPublicSerializer(serializers.ModelSerializer):
    """Lista dietetyków do wyboru przy wysyłaniu prośby."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class DietitianRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_username = serializers.CharField(source='patient.username', read_only=True)
    dietitian_name = serializers.CharField(source='dietitian.get_full_name', read_only=True)
    dietitian_username = serializers.CharField(source='dietitian.username', read_only=True)

    class Meta:
        model = DietitianRequest
        fields = ['id', 'patient', 'patient_name', 'patient_username',
                  'dietitian', 'dietitian_name', 'dietitian_username',
                  'status', 'message', 'created_at']
        read_only_fields = ['id', 'status', 'created_at', 'patient']