from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Recipe(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(
        blank=True,
        help_text="Sposób przygotowania potrawy"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recipes'
    )
    products = models.ManyToManyField(
        'products.Product',
        through='RecipeIngredient',
        related_name='recipes'
    )

    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    weight_in_grams = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Waga składnika w gramach (wartość dodatnia)"
    )

    class Meta:
        unique_together = ('recipe', 'product')

    def __str__(self):
        return f"{self.weight_in_grams}g of {self.product.name} in {self.recipe.name}"


class DietPlan(models.Model):
    name = models.CharField(max_length=255)

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='diet_plans_as_patient'
    )
    dietitian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='diet_plans_as_dietitian'
    )

    start_date = models.DateField()
    end_date = models.DateField()
    daily_calories_goal = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.patient.username})"


class DailyMenu(models.Model):
    diet_plan = models.ForeignKey(
        DietPlan,
        on_delete=models.CASCADE,
        related_name='daily_menus'
    )
    day_number = models.PositiveIntegerField(
        help_text="Numer dnia diety, np. Day 1, Day 2"
    )

    class Meta:
        unique_together = ('diet_plan', 'day_number')

    def __str__(self):
        return f"Dzień {self.day_number} - {self.diet_plan.name}"


class ScheduledMeal(models.Model):
    MEAL_CHOICES = [
        ('BREAKFAST', 'Śniadanie'),
        ('LUNCH', 'II Śniadanie'),
        ('DINNER', 'Obiad'),
        ('SNACK', 'Podwieczorek'),
        ('SUPPER', 'Kolacja'),
    ]

    daily_menu = models.ForeignKey(
        DailyMenu,
        on_delete=models.CASCADE,
        related_name='meals'
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='scheduled_meals'
    )
    meal_type = models.CharField(
        max_length=20,
        choices=MEAL_CHOICES
    )

    def __str__(self):
        return f"{self.get_meal_type_display()} (Dzień {self.daily_menu.day_number})"
