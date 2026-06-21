from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['author']