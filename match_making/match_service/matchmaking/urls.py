from django.urls import path

from .views import FindMatch

urlpatterns = [
    path("findmatch/", FindMatch.as_view(), name="find-match")
]