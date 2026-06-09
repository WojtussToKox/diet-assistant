from django.db import models

# Create your models here.

class Product(models.Model):
    name = models.CharField(max_length=255)
    calories_per_100g = models.PositiveIntegerField()
    protein_per_100g = models.PositiveIntegerField()
    fat_per_100g = models.PositiveIntegerField()
    carbs_per_100g = models.PositiveIntegerField()
