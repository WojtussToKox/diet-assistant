from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Product
from .serializers import ProductSerializer
from diets.services import ProductImportService
import tempfile
import os

# Create your views here.
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        if request.user.role != 'DIETITIAN':
            return Response({"detail": "Only dietitians can import the product database."}, status=403)
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=400)
        fd, tmp_path = tempfile.mkstemp(suffix='.csv')
        try:
            with os.fdopen(fd, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)

            results = ProductImportService.load_from_csv(tmp_path)
            return Response(results, status=200)

        except Exception as e:
            return Response({"detail": f"Import error: {str(e)}"}, status=400)
        finally:
            os.remove(tmp_path)