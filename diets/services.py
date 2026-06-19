import logging
from decimal import Decimal
import pandas as pd
import json
import csv
from pathlib import Path
from collections import defaultdict
from .exceptions import (
    DataAggregationError,
    FileExportError,
    CSVFileNotFoundError,
    InvalidCSVStructureError,
    MissingRecipeError,
)

logger = logging.getLogger(__name__)

class DietCalculatorService:
    @staticmethod
    def calculate_ingredient(weight_in_grams: int, product) -> dict:
        if weight_in_grams is None or weight_in_grams <= 0:
            raise ValueError("Weight in grams must be greater than zero.")

        if not product:
            raise ValueError("No product assigned.")

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
                raise MissingRecipeError(
                    f"Cannot calculate DailyMenu ID: {daily_menu.id}. "
                    f"ScheduledMeal ID: {meal.id} has no assigned recipe."
                )

            recipe_macros = DietCalculatorService.calculate_recipe(meal.recipe)

            for key in total_macros:
                total_macros[key] += recipe_macros[key]

        return total_macros
    
    @staticmethod
    def calculate_daily_caloric_needs(weight_kg, height_cm, age=30, gender='M') -> int:
        if not weight_kg or not height_cm:
            return 2000 
        
        s = 5 if gender != 'F' else -161
        bmr = (10 * float(weight_kg)) + (6.25 * float(height_cm)) - (5 * age) + s
        return round(bmr * 1.2)

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
                f"DietPlan '{self.diet_plan.name}' contains no daily menus."
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
                f"DietPlan '{self.diet_plan.name}' has no daily calories goal set."
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
                "DietPlan '%s': no deviations above %.1f%%.",
                self.diet_plan.name,
                threshold_pct,
            )
            return []

        logger.warning(
            "DietPlan '%s': detected %d days with deviation > %.1f%%.",
            self.diet_plan.name,
            len(deviating),
            threshold_pct,
        )

        return deviating[
            ['day_number', 'calories', 'goal', 'deviation_pct', 'deviation_abs', 'status']
        ].to_dict(orient='records')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

class DietPlanExportService:
    def __init__(self, diet_plan, calculator=None):
        self.diet_plan = diet_plan
        self.calculator = calculator or DietCalculatorService

    def _aggregate_shopping_list(self) -> list[dict]:
        aggregated = defaultdict(lambda: {
            'product_id': None,
            'total_grams': 0,
            'total_calories': Decimal('0.00'),
        })

        daily_menus = self.diet_plan.daily_menus.prefetch_related(
            'meals__recipe__recipeingredient_set__product',
            'meals__product'
        ).all()

        if not daily_menus.exists():
            raise DataAggregationError(
                f"DietPlan '{self.diet_plan.name}' contains no daily menus."
            )

        for menu in daily_menus:
            for meal in menu.meals.select_related('recipe', 'product').all():
                if meal.recipe:
                    ingredients = meal.recipe.recipeingredient_set.select_related('product').all()
                    for ingredient in ingredients:
                        product = ingredient.product
                        entry = aggregated[product.name]

                        entry['product_id'] = product.id
                        entry['total_grams'] += ingredient.weight_in_grams

                        macros = self.calculator.calculate_ingredient(
                            ingredient.weight_in_grams, product
                        )
                        entry['total_calories'] += macros['calories']

                elif meal.product:
                    product = meal.product
                    entry = aggregated[product.name]

                    entry['product_id'] = product.id
                    entry['total_grams'] += meal.weight_in_grams

                    macros = self.calculator.calculate_ingredient(
                        meal.weight_in_grams, product
                    )
                    entry['total_calories'] += macros['calories']

        if not aggregated:
            raise DataAggregationError(
                f"DietPlan '{self.diet_plan.name}' contains no ingredients to aggregate."
            )

        return [
            {
                'product_name': name,
                'product_id': data['product_id'],
                'total_grams': data['total_grams'],
                'total_calories': data['total_calories'],
            }
            for name, data in sorted(aggregated.items())
        ]

    def export_shopping_list_json(self, output_path: str) -> Path:
        shopping_list = self._aggregate_shopping_list()

        output = {
            'diet_plan': self.diet_plan.name,
            'patient': str(self.diet_plan.patient),
            'period': f"{self.diet_plan.start_date} - {self.diet_plan.end_date}",
            'shopping_list': shopping_list,
        }

        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with path.open('w', encoding='utf-8') as f:
                json.dump(output, f, cls=DecimalEncoder, ensure_ascii=False, indent=2)
        except OSError as e:
            raise FileExportError(f"Cannot save JSON file {output_path}: {e}") from e

        logger.info("Exported shopping list (JSON): %s", path)
        return path


    def export_shopping_list_csv(self, output_path: str) -> Path:
        shopping_list = self._aggregate_shopping_list()

        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with path.open('w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(
                    f,
                    fieldnames=['product_name', 'product_id', 'total_grams', 'total_calories']
                )
                writer.writeheader()

                for row in shopping_list:
                    writer.writerow({
                        **row,
                        'total_calories': str(row['total_calories']),
                    })
        except OSError as e:
            raise FileExportError(f"Cannot save CSV file {output_path}: {e}") from e

        logger.info("Exported shopping list (CSV): %s", path)
        return path

class ProductImportService:
    REQUIRED_FIELDS = {
        'name', 'calories_per_100g', 'protein_per_100g',
        'fat_per_100g', 'carbs_per_100g',
    }

    @classmethod
    def load_from_csv(cls, csv_path: str) -> dict:
        from products.models import Product

        results = {'created': 0, 'skipped': 0, 'errors': []}

        path = Path(csv_path)
        if not path.exists():
            raise CSVFileNotFoundError(f"CSV file does not exist: {csv_path}")

        with path.open('r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            if not cls.REQUIRED_FIELDS.issubset(set(reader.fieldnames or [])):
                missing = cls.REQUIRED_FIELDS - set(reader.fieldnames or [])
                raise InvalidCSVStructureError(f"CSV is missing required columns: {missing}")

            for row_num, row in enumerate(reader, start=2):
                try:
                    name = row['name'].strip()
                    if not name:
                        raise ValueError("Empty product name.")

                    product, created = Product.objects.get_or_create(
                        name=name,
                        defaults={
                            'calories_per_100g': Decimal(row['calories_per_100g']),
                            'protein_per_100g':  Decimal(row['protein_per_100g']),
                            'fat_per_100g':      Decimal(row['fat_per_100g']),
                            'carbs_per_100g':    Decimal(row['carbs_per_100g']),
                        }
                    )

                    if created:
                        results['created'] += 1
                    else:
                        results['skipped'] += 1
                        logger.info("Product '%s' already exists — skipped.", name)

                except (KeyError, ValueError, Exception) as e:  # noqa: BLE001
                    msg = f"Row {row_num}: {e}"
                    results['errors'].append(msg)
                    results['skipped'] += 1
                    logger.warning("Skipped CSV row — %s", msg)

        logger.info(
            "CSV import finished: %d created, %d skipped, %d errors.",
            results['created'], results['skipped'] - len(results['errors']), len(results['errors'])
        )
        return results