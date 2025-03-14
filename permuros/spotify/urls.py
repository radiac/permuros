from django.urls import path

from . import views

app_name = "spotify"

urlpatterns = [
    path("", views.Login.as_view(), name="login"),
    path("callback/", views.LoginCallback.as_view(), name="login_callback"),
    path("refresh_token/", views.RefreshToken.as_view(), name="refresh_token"),
    path("tracks/", views.Tracks.as_view(), name="tracks"),
    path("settings/", views.Settings.as_view(), name="settings"),
]
