import datetime
import json

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic import View

from .api import Api, ApiError, NotAuthenticatedError
from .models import Session


class SpotifyView(LoginRequiredMixin, View):
    def dispatch(self, request, *args, **kwargs):
        self.api = Api(request)
        try:
            return super().dispatch(request, *args, **kwargs)
        except NotAuthenticatedError:
            return redirect("spotify:login")
        except Exception as e:
            return render(request, "error.html", context={"error": e})


class Login(SpotifyView):
    def get(self, request):
        if request.GET.get("reset"):
            session = self.api.session
            if session:
                session.delete()

        try:
            _ = self.api.access_token
        except NotAuthenticatedError:
            return render(request, "spotify/login.html")
        except ApiError as e:
            return render(request, "spotify/login.html", context={"error": e})

        if not self.api.session.playlist_id:
            return redirect("spotify:settings")
        else:
            return redirect("spotify:tracks")

    def post(self, request):
        return redirect(self.api.auth_url)


class LoginCallback(SpotifyView):
    def get(self, request):
        code = request.GET.get("code")
        self.api.grant_access_token(code)
        # if admin show settings
        return redirect("spotify:settings")


class RefreshToken(SpotifyView):
    def get(self, request):
        session = self.api.session
        session.access_token_granted = datetime.datetime.min
        # No need to save

        # Trigger update
        self.api.access_token

        return JsonResponse(
            data={
                "accessToken": self.api.session.access_token,
                "accessExpiresIn": self.api.session.old_in,
            }
        )


class Settings(SpotifyView):
    def get(self, request, *args, **kwargs):
        playlists = self.api.get_playlists()
        devices = self.api.get_devices()
        return render(
            request,
            "spotify/settings.html",
            {
                "playlists": playlists,
                "devices": devices,
            },
        )

    def post(self, request, *args, **kwargs):
        playlist_id = request.POST.get("playlist_id")
        session = self.api.session
        session.playlist_id = playlist_id
        session.save()
        return redirect("spotify:tracks")


class Track:
    def __init__(self, api_data):
        self.id = api_data["track"]["id"]
        self.name = api_data["track"]["name"]
        self.duration_ms = api_data["track"]["duration_ms"]
        self.explicit = api_data["track"]["explicit"]
        self.artists = [artist["name"] for artist in api_data["track"]["artists"]]
        self.album = api_data["track"]["album"]["name"]
        self.image = api_data["track"]["album"]["images"][0]["url"]
        self.release_date = api_data["track"]["album"]["release_date"].split("-", 1)[0]

    @property
    def duration(self):
        dur_sec = self.duration_ms // 1000
        min = dur_sec // 60
        sec = dur_sec % 60
        return f"{min:02}:{sec:02}"

    @property
    def release_year(self):
        return self.release_date.split("-", 1)[0]


class Tracks(SpotifyView):
    def get(self, request):
        playlist_id = self.api.session.playlist_id
        if not playlist_id:
            tracks = []
        else:
            tracks = self.api.get_tracks(playlist_id=playlist_id)

        context = {
            "playlist_id": playlist_id,
            "tracks": [Track(track) for track in tracks],
            "player_settings": {
                "name": f"PermurOS: {request.user.username}",
                "accessToken": self.api.access_token,
                "accessExpiresIn": self.api.session.old_in,
                "refreshTokenUrl": reverse("spotify:refresh_token"),
                "deviceName": self.api.session.device_name,
                "playlistId": self.api.session.playlist_id,
            },
        }
        return render(request, "spotify/tracks.html", context)
