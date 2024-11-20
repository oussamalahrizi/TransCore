from django.urls import path, include
from .views import RegisterInput
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="auth API",
      default_version='v1',
      description="Test description",
   ),
   public=True,
)

urlpatterns = [
	path('register/', RegisterInput.as_view() , name="register-email"),
	path('swagger/', schema_view.with_ui('swagger'), name='schema-swagger-ui'),
	path('redoc/', schema_view.with_ui('redoc'), name='schema-redoc-ui'),
	
]
