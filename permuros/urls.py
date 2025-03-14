"""
URL configuration for permuros project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.urls import URLPattern, URLResolver, include, path
from django.views.generic import TemplateView

from . import views

urlpatterns: list[URLResolver | URLPattern] = [
    path("admin/", admin.site.urls),
    path(
        r"accounts/",
        login_required(
            TemplateView.as_view(
                template_name="accounts/index.html",
            )
        ),
    ),
    path(r"accounts/", include("django.contrib.auth.urls")),
    path("write/", include("permuros.write.urls", namespace="write")),
    path("draw/", include("permuros.draw.urls", namespace="draw")),
    path("spotify/", include("permuros.spotify.urls", namespace="spotify")),
    path("bank/", include("permuros.bank.urls", namespace="bank")),
    path("", views.home, name="home"),
]

# Serve static files
if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns.extend(static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT))
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))
