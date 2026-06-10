from rest_framework import serializers
from .models import Recipe, RecipeIngredient, DietPlan, DailyMenu, ScheduledMeal


class RecipeIngredientSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'product', 'product_name', 'weight_in_grams']


class RecipeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description']


class RecipeDetailSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(source='recipeingredient_set', many=True)
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description', 'author', 'ingredients']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('recipeingredient_set')
        recipe = Recipe.objects.create(**validated_data)
        for ingredient in ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **ingredient)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('recipeingredient_set', None)
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if ingredients_data is not None:
            instance.recipeingredient_set.all().delete()
            for ingredient in ingredients_data:
                RecipeIngredient.objects.create(recipe=instance, **ingredient)

        return instance


class ScheduledMealSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledMeal
        fields = '__all__'


class DailyMenuListSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMenu
        fields = '__all__'


class DailyMenuDetailSerializer(serializers.ModelSerializer):
    meals = ScheduledMealSerializer(many=True, read_only=True)

    class Meta:
        model = DailyMenu
        fields = ['id', 'diet_plan', 'day_number', 'meals']


class DietPlanListSerializer(serializers.ModelSerializer):
    dietitian = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = DietPlan
        fields = ['id', 'name', 'patient', 'dietitian', 'start_date', 'end_date', 'daily_calories_goal']


class DietPlanDetailSerializer(serializers.ModelSerializer):
    dietitian = serializers.HiddenField(default=serializers.CurrentUserDefault())
    daily_menus = DailyMenuDetailSerializer(many=True, read_only=True)

    class Meta:
        model = DietPlan
        fields = ['id', 'name', 'patient', 'dietitian', 'start_date', 'end_date', 'daily_calories_goal', 'daily_menus']