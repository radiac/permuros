from django.urls import path

from . import views

app_name = "bank"

urlpatterns = [
    path("", views.transactions, name="transactions"),
]
