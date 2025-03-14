from datetime import timedelta

from django.conf import settings
from django.urls import reverse
from django.utils import timezone

import requests

from .models import Session


class ApiError(Exception):
    pass


class NoSessionError(ApiError):
    pass


class NotAuthenticatedError(ApiError):
    pass


class Api:
    def __init__(self, request):
        self.request = request
        self.user = request.user

    @property
    def auth_url(self):
        scope = [
            "streaming",
            "user-read-email",
            "user-read-private",
            "playlist-read-private",
            "user-read-playback-state",
            "user-modify-playback-state",
        ]
        auth_url = (
            "https://accounts.spotify.com/authorize?response_type=code"
            f"&client_id={settings.SPOTIFY_CLIENT_ID}"
            f"&redirect_uri={self.auth_callback_url}"
            f"&scope={' '.join(scope)}"
        )
        return auth_url

    @property
    def auth_callback_url(self):
        return self.request.build_absolute_uri(reverse("spotify:login_callback"))

    @property
    def session(self) -> Session:
        try:
            return Session.objects.get(user=self.user)
        except Session.DoesNotExist:
            raise NoSessionError()

    @property
    def access_token(self):
        try:
            session = self.session
        except NoSessionError:
            # Only thing we care about here is we're not authenticated, change error
            raise NotAuthenticatedError()

        now = timezone.now()
        if session.access_token_old < now:
            # refresh access token
            access_token = self.refresh_access_token(session.refresh_token)
            session.access_token = access_token
            session.access_token_granted = now
            session.save()

        return session.access_token

    def grant_access_token(self, code):
        token_url = "https://accounts.spotify.com/api/token"
        response = requests.post(
            token_url,
            {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self.auth_callback_url,
                "client_id": settings.SPOTIFY_CLIENT_ID,
                "client_secret": settings.SPOTIFY_CLIENT_SECRET,
            },
        )
        token_info = response.json()
        expires_in = timedelta(seconds=token_info["expires_in"])
        Session.objects.update_or_create(
            user=self.user,
            defaults={
                "access_token": token_info["access_token"],
                "refresh_token": token_info["refresh_token"],
                "access_token_granted": timezone.now(),
                "access_token_expires": timezone.now() + expires_in,
            },
        )

    def refresh_access_token(self, refresh_token) -> str:
        token_url = "https://accounts.spotify.com/api/token"
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": settings.SPOTIFY_CLIENT_ID,
            "client_secret": settings.SPOTIFY_CLIENT_SECRET,
        }
        response = requests.post(token_url, data=payload)
        token_info = response.json()
        if "access_token" in token_info:
            return token_info["access_token"]

        raise NotAuthenticatedError()

    def _get(self, url):
        headers = {
            "Authorization": f"Bearer {self.access_token}",
        }
        response = requests.get(url, headers=headers)
        return response.json()

    def get_playlists(self):
        data = self._get("https://api.spotify.com/v1/me/playlists")
        playlists = data.get("items", [])
        return playlists

    def get_devices(self):
        data = self._get("https://api.spotify.com/v1/me/player/devices")
        devices = data.get("devices", [])
        return devices

    def get_tracks(self, playlist_id):
        data = self._get(f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks")
        tracks = data.get("items", [])
        return tracks
