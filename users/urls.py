from django.urls import path
from .views import RegisterView, UserMeView, ChangePasswordView, MyPatientsView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, UserMeView, ChangePasswordView,
    MyPatientsView, DietitianListView, DietitianRequestViewSet,
)

router = DefaultRouter()
router.register('dietitian-requests', DietitianRequestViewSet, basename='dietitian-request')


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserMeView.as_view(), name='user-me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('my-patients/', MyPatientsView.as_view()),
    path('dietitians/', DietitianListView.as_view()),
    path('', include(router.urls)),
]