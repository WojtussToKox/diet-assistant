from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

class User(AbstractUser):
    ROLE_CHOICES = [
        ('DIETETITAN', 'Dietetyk'),
        ('PATIENT', 'Pacjent'),
        ('STANDARD', 'Użytkownik standardowy'),
    ]

    GENDER_CHOICES = [
        ('M', 'Mężczyzna'),
        ('F', 'Kobieta'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='STANDARD',
        verbose_name='Rola'
    )

    dietetitian = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patients',
        verbose_name="Dietetyk prowadzący",
        help_text="Wybierz dietetyka z listy, jeśli użytkownik jest pacjentem."
    )
    
    date_of_birth = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Data urodzenia"
    )

    gender = models.CharField(
        max_length=1, 
        choices=GENDER_CHOICES, 
        null=True, 
        blank=True, 
        verbose_name="Płeć"
    )

    height_cm = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(50)],
        verbose_name="Wzrost (cm)"
    )

    weight_kg = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(10.00)],
        verbose_name="Waga (kg)"
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"