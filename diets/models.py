from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class Recipe(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, help_text="Sposób przygotowania potrawy")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recipes')
    products = models.ManyToManyField('products.Product', through='RecipeIngredient', related_name='recipes')

    def __str__(self): return self.name

class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    weight_in_grams = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta: unique_together = ('recipe', 'product')
    def __str__(self): return f"{self.weight_in_grams}g of {self.product.name} in {self.recipe.name}"


class DietPlan(models.Model):
    name = models.CharField(max_length=255)

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Zmienione z CASCADE na SET_NULL
        null=True,                 # Dodano: pozwala na brak przypisanego pacjenta
        blank=True,                # Dodano: pozwala na brak przypisanego pacjenta
        related_name='diet_plans_as_patient'
    )
    dietitian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='diet_plans_as_dietitian'
    )
    
    daily_calories_goal = models.PositiveIntegerField()

    def __str__(self):
        patient_name = self.patient.username if self.patient else "Template (No patient)"
        return f"{self.name} ({patient_name})"


class DailyMenu(models.Model):
    DAY_CHOICES = [(1, 'Poniedziałek'), (2, 'Wtorek'), (3, 'Środa'), (4, 'Czwartek'), (5, 'Piątek'), (6, 'Sobota'), (7, 'Niedziela')]
    diet_plan = models.ForeignKey(DietPlan, on_delete=models.CASCADE, related_name='daily_menus')
    day_of_week = models.IntegerField(choices=DAY_CHOICES) # Zamiast day_number, mamy konkretny dzień tygodnia

    class Meta:
        unique_together = ('diet_plan', 'day_of_week')
        ordering = ['day_of_week']

    def __str__(self): return f"{self.get_day_of_week_display()} - {self.diet_plan.name}"


class ScheduledMeal(models.Model):
    MEAL_CHOICES = [
        ('BREAKFAST', 'Śniadanie'),
        ('LUNCH', 'II Śniadanie'),
        ('DINNER', 'Obiad'),
        ('SNACK', 'Podwieczorek'),
        ('SUPPER', 'Kolacja'),
    ]

    daily_menu = models.ForeignKey(DailyMenu, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    
    # Posiłek może być Przepisem ALBO bezpośrednim Produktem
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, null=True, blank=True, related_name='scheduled_meals')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='scheduled_meals')
    weight_in_grams = models.PositiveIntegerField(null=True, blank=True, help_text="Tylko dla pojedynczych produktów")
    
    order_index = models.PositiveIntegerField(default=0) # Do pozycjonowania w przyszłości

    class Meta: ordering = ['meal_type', 'order_index']

    def clean(self):
        if self.recipe and self.product: raise ValidationError("Wybierz przepis ALBO produkt, nie oba.")
        if not self.recipe and not self.product: raise ValidationError("Musisz wybrać przepis lub produkt.")
        if self.product and not self.weight_in_grams: raise ValidationError("Waga jest wymagana dla produktu.")

    def __str__(self):
        item = self.recipe.name if self.recipe else f"{self.product.name} ({self.weight_in_grams}g)"
        return f"{item} - {self.get_meal_type_display()} (Day {self.daily_menu.day_of_week})"