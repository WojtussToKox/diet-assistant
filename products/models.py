from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.conf import settings

# Create your models here.

class Product(models.Model):
    name = models.CharField(max_length=255, unique=True)
    calories_per_100g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    protein_per_100g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    fat_per_100g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    carbs_per_100g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        null=True,  
        blank=True
    )

    def __str__(self):
        return self.name
