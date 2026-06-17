from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

class User(AbstractUser):
    ROLE_CHOICES = [
        ('DIETITAN', 'Dietitian'),
        ('PATIENT', 'Patient'),
        ('STANDARD', 'Standard User'),
    ]

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='STANDARD',
        verbose_name='Role'
    )

    dietetitian = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patients',
        verbose_name="Leading dietitian",
        help_text="Select a dietitian from the list if the user is a patient."
    )
    
    date_of_birth = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Date of birth"
    )

    gender = models.CharField(
        max_length=1, 
        choices=GENDER_CHOICES, 
        null=True, 
        blank=True, 
        verbose_name="Gender"
    )

    height_cm = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(10)],
        verbose_name="Height (cm)"
    )

    weight_kg = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(2.00)],
        verbose_name="Weight (kg)"
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"