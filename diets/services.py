import logging
from decimal import Decimal
import pandas as pd

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

class DietAnalyticsService:

    def __init__(self, diet_plan, calculator=None):
        self.diet_plan = diet_plan
        self.calculator = calculator or DietCalculatorService

    def _build_dataframe(self) -> pd.DataFrame:
        daily_menus = self.diet_plan.daily_menus.prefetch_related(
            'meals__recipe__recipeingredient_set__product'
        ).all()

        if not daily_menus.exists():
            raise ValueError(
                f"DietPlan '{self.diet_plan.name}' nie zawiera żadnych dni menu."
            )
        rows = []
        for menu in daily_menus:
            macros = self.calculator.calculate_daily_menu(menu)
            rows.append({
               'day_number': menu.day_number,
                'calories': float(macros['calories']),
                'protein': float(macros['protein']),
                'fat': float(macros['fat']),
                'carbs': float(macros['carbs']),
             })
        return (
            pd.DataFrame(rows)
            .sort_values('day_number')
            .reset_index(drop=True)
        )

    def get_daily_averages(self) -> dict:
        df = self._build_dataframe()
        averages = df[['calories', 'protein', 'fat', 'carbs']].mean().round(2)

        return {
            'avg_calories':  averages['calories'],
            'avg_protein':   averages['protein'],
            'avg_fat':       averages['fat'],
            'avg_carbs':     averages['carbs'],
            'days_analyzed': len(df),
        }

    def detect_calories_deviations(self, threshold_pct: float = 20.0) -> list[dict]:
        if not self.diet_plan.daily_calories_goal:
            raise ValueError(
                f"DietPlan '{self.diet_plan.name}' nie ma ustawionego celu kalorycznego."
            )
        goal = float(self.diet_plan.daily_calories_goal)
        df = self._build_dataframe()

        df['goal'] = goal
        df['deviation_pct'] = ((df['calories'] - goal) / goal * 100).round(2)
        df['deviation_abs'] = (df['calories'] - goal).round(2)
        df['status'] = df['deviation_pct'].apply(
            lambda x: 'OVER' if x > 0 else 'UNDER'
       )

        deviating = df[df['deviation_pct'].abs() > threshold_pct]

        if deviating.empty:
            logger.info(
                "DietPlan '%s': brak odchyleń powyżej %.1f%%.",
                self.diet_plan.name,
                threshold_pct,
            )
            return []

        logger.warning(
            "DietPlan '%s': wykryto %d dni z odchyleniem > %.1f%%.",
            self.diet_plan.name,
            len(deviating),
            threshold_pct,
        )

        return deviating[
            ['day_number', 'calories', 'goal', 'deviation_pct', 'deviation_abs', 'status']
        ].to_dict(orient='records')