from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Settings(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    auto_reload = models.BooleanField(
        default=False,
        help_text="Enable auto-reload during development",
    )

    class Meta:
        verbose_name = "Settings"
        verbose_name_plural = "Settings"

    def __str__(self):
        return f"Settings for {self.user}"


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    Settings.objects.get_or_create(user=instance)
