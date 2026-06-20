from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, DietitianRequest
from .permissions import IsAdmin, IsDietitian
from .serializers import (
    UserRegistrationSerializer, CustomTokenObtainPairSerializer,
    UserMeSerializer, PatientSerializer, DietitianPublicSerializer,
    DietitianRequestSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        # Parametr partial=True pozwala na aktualizację tylko wybranych pól (np. tylko samej wagi)
        serializer = UserMeSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
            
        # Jeśli dane są niepoprawne, zwróć błąd 400
        return Response(serializer.errors, status=400)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'old_password': 'Incorrect password.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed successfully.'})
    
class MyPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'DIETITIAN':
            return Response({'detail': 'Forbidden.'}, status=403)
        patients = User.objects.filter(dietitian=request.user)
        return Response(PatientSerializer(patients, many=True).data)
    
class DietitianListView(APIView):
    """Wszyscy dietetycy — do wyboru przy wysyłaniu prośby."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dietitians = User.objects.filter(role='DIETITIAN')
        return Response(DietitianPublicSerializer(dietitians, many=True).data)


class DietitianRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DietitianRequestSerializer
    http_method_names = ['get', 'post', 'head', 'options', 'delete']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DIETITIAN':
            # dietetyk widzi prośby skierowane do niego
            return DietitianRequest.objects.filter(dietitian=user)
        else:
            # pacjent/standard widzi swoje wysłane prośby
            return DietitianRequest.objects.filter(patient=user)

    def perform_create(self, serializer):
        # pacjent wysyła prośbę — patient ustawiane automatycznie
        serializer.save(patient=self.request.user)

    def create(self, request, *args, **kwargs):
        # nie można wysłać prośby do samego siebie
        dietitian_id = request.data.get('dietitian')
        if str(request.user.id) == str(dietitian_id):
            return Response({'detail': 'Cannot send request to yourself.'},
                            status=status.HTTP_400_BAD_REQUEST)
        # nie można wysłać drugiej prośby do tego samego dietetyka
        if DietitianRequest.objects.filter(
            patient=request.user, dietitian_id=dietitian_id, status='PENDING'
        ).exists():
            return Response({'detail': 'Request already pending.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.dietitian != request.user:
            return Response({'detail': 'Forbidden.'}, status=403)
        if req.status != 'PENDING':
            return Response({'detail': 'Request already resolved.'}, status=400)

        req.status = 'ACCEPTED'
        req.save()

        # przypisz dietetyka do pacjenta
        req.patient.dietitian = req.dietitian
        req.patient.role = 'PATIENT'
        req.patient.save()

        return Response({'detail': 'Accepted.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.dietitian != request.user:
            return Response({'detail': 'Forbidden.'}, status=403)
        if req.status != 'PENDING':
            return Response({'detail': 'Request already resolved.'}, status=400)

        req.status = 'REJECTED'
        req.save()

        return Response({'detail': 'Rejected.'})
    
class EndCooperationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, target_user_id):
        user = request.user
        # Scenario A: Logged-in user is a dietitian, and target_user_id is their patient
        patient_as_target = User.objects.filter(id=target_user_id, dietitian=user).first()
        # Scenario B: Logged-in user is a patient, and target_user_id is their dietitian
        dietitian_as_target = None
        if getattr(user, 'dietitian', None) and user.dietitian.id == target_user_id:
            dietitian_as_target = user.dietitian
        # Identify who is who before removing the relationship
        if patient_as_target:
            patient = patient_as_target
            dietitian = user
        elif dietitian_as_target:
            patient = user
            dietitian = dietitian_as_target
        else:
            return Response({"detail": "No active cooperation found between you."}, status=400)

        # 1. Unlink the dietitian from the patient's profile
        patient.dietitian = None
        patient.save()
        # 2. Delete the related (accepted) request
        DietitianRequest.objects.filter(
            patient=patient, 
            dietitian=dietitian, 
            status='ACCEPTED'
        ).delete()

        return Response({"detail": "Cooperation has been successfully ended."}, status=200)