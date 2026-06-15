import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class DietCalculatorService:
    @staticmethod
    def calculate_ingredient(weight_in_grams: int, product) -> dict:
        if weight_in_grams is None or weight_in_grams <= 0:
            raise ValueError("Gramatura musi być większa od zera.")

        if not product:
            raise ValueError("Brak przypisanego produktu.")

        multiplier = Decimal(str(weight_in_grams)) / Decimal('100.0')

        return {
            'calories': round(Decimal(str(product.calories_per_100g)) * multiplier, 2),
            'protein':  round(Decimal(str(product.protein_per_100g))  * multiplier, 2),
            'fat':      round(Decimal(str(product.fat_per_100g))       * multiplier, 2),
            'carbs':    round(Decimal(str(product.carbs_per_100g))     * multiplier, 2),
        }

    @staticmethod
    def calculate_recipe(recipe) -> dict:
        total_macros = {
            'calories': Decimal('0.00'),
            'protein':  Decimal('0.00'),
            'fat':      Decimal('0.00'),
            'carbs':    Decimal('0.00'),
        }

        ingredients = recipe.recipeingredient_set.select_related('product').all()

        for ingredient in ingredients:
            macros = DietCalculatorService.calculate_ingredient(
                ingredient.weight_in_grams,
                ingredient.product
            )
            for key in total_macros:
                total_macros[key] += macros[key]

        return total_macros

    @staticmethod
    def calculate_daily_menu(daily_menu) -> dict:
        total_macros = {
            'calories': Decimal('0.00'),
            'protein':  Decimal('0.00'),
            'fat':      Decimal('0.00'),
            'carbs':    Decimal('0.00'),
        }

        scheduled_meals = daily_menu.meals.select_related('recipe').prefetch_related(
            'recipe__recipeingredient_set__product'
        ).all()

        for meal in scheduled_meals:
            if not meal.recipe:
                logger.warning(
                    "Posiłek ID: %s w DailyMenu ID: %s nie ma przypisanego przepisu! Pominięto.",
                    meal.id,
                    daily_menu.id,
                )
                continue

            recipe_macros = DietCalculatorService.calculate_recipe(meal.recipe)

            for key in total_macros:
                total_macros[key] += recipe_macros[key]

        return total_macros