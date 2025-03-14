from datetime import datetime, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

# If an access token is going to expire in EXPIRY_WINDOW seconds it is old
EXPIRY_WINDOW = 5


class Session(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    access_token_granted = models.DateTimeField()
    access_token_expires = models.DateTimeField()
    playlist_id = models.CharField(max_length=255, blank=True)
    device_name = models.CharField(max_length=255, blank=True)

    @property
    def access_token_old(self) -> datetime:
        """
        Time when the access token is deemed old, EXPIRY_WINDOW away from expiring
        """
        return self.access_token_expires + timedelta(minutes=EXPIRY_WINDOW)

    @property
    def old_in(self) -> int:
        """
        Number of seconds before this will be old, or 0 if it is already
        """
        old_in = int((timezone.now() - self.access_token_old).total_seconds())
        if old_in < 0:
            old_in = 0
        return old_in
