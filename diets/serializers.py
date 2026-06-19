from rest_framework import serializers
from .models import Recipe, RecipeIngredient, DietPlan, DailyMenu, ScheduledMeal


class RecipeIngredientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'product', 'product_name', 'weight_in_grams']


class RecipeListSerializer(serializers.ModelSerializer):
    total_calories = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description', 'total_calories']

    def get_total_calories(self, obj):
        total = 0
        for ingredient in obj.recipeingredient_set.all():
            if ingredient.product and ingredient.product.calories_per_100g:
                total += (ingredient.product.calories_per_100g / 100) * ingredient.weight_in_grams
        return round(total)


class RecipeDetailSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(source='recipeingredient_set', many=True)
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Recipe
        fields = ['id', 'name', 'description', 'author', 'ingredients']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('recipeingredient_set', [])
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
            existing_ingredients = {
                ingredient.product: ingredient
                for ingredient in instance.recipeingredient_set.all()
            }

            for ingredient_data in ingredients_data:
                product = ingredient_data.get('product')

                if product and product in existing_ingredients:
                    ingredient_instance = existing_ingredients.pop(product)

                    for attr, value in ingredient_data.items():
                        if attr not in ['id', 'recipe', 'product']:
                            setattr(ingredient_instance, attr, value)
                    ingredient_instance.save()
                else:
                    ingredient_data.pop('id', None)
                    RecipeIngredient.objects.create(recipe=instance, **ingredient_data)

            for ingredient_to_delete in existing_ingredients.values():
                ingredient_to_delete.delete()

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
        fields = ['id', 'diet_plan', 'day_of_week', 'meals']


class DietPlanListSerializer(serializers.ModelSerializer):
    dietitian = serializers.HiddenField(default=serializers.CurrentUserDefault())
    dietitian_name = serializers.SerializerMethodField()

    class Meta:
        model = DietPlan
        fields = ['id', 'name', 'patient', 'dietitian', 'dietitian_name', 'daily_calories_goal']
        extra_kwargs = {
            'daily_calories_goal': {'required': False},
            'name': {'required': False},
        }

    def get_dietitian_name(self, obj):
        if not obj.dietitian:
            return None
        return obj.dietitian.first_name or obj.dietitian.username

    def validate_patient(self, value):
        if value is None:
            return value
            
        user = self.context['request'].user
        
        if user.role == 'DIETITIAN':
            if value.role != 'PATIENT':
                raise serializers.ValidationError("Chosen user has to have role - Patient")
            if value.dietitian != user:
                raise serializers.ValidationError("Cannot set a diet for patient that is not assigned to you.")
                
        elif user.role == 'STANDARD':
            if value != user:
                raise serializers.ValidationError("Standard user can create a diet exclusively for yourself.")
                
        elif user.role == 'PATIENT':
             raise serializers.ValidationError("Patients cannot create their own diets.")
             
        return value


class DietPlanDetailSerializer(serializers.ModelSerializer):
    dietitian = serializers.HiddenField(default=serializers.CurrentUserDefault())
    dietitian_name = serializers.SerializerMethodField()
    daily_menus = DailyMenuDetailSerializer(many=True, read_only=True)

    class Meta:
        model = DietPlan
        fields = ['id', 'name', 'patient', 'dietitian', 'dietitian_name',
                  'daily_calories_goal', 'daily_menus']

    def get_dietitian_name(self, obj):
        if not obj.dietitian:
            return None
        return obj.dietitian.first_name or obj.dietitian.username