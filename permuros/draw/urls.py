from django.urls import path

from . import views

app_name = "draw"

urlpatterns = [
    path("", views.AppView.as_view(), name="app"),
    path("open/<int:pk>/", views.OpenView.as_view(), name="open"),
    path("save/", views.SaveView.as_view(), name="save"),
]
