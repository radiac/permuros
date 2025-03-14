from django.contrib import admin
from django.utils.html import format_html

from .models import Image


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    readonly_fields = ("image_preview",)  # Add the read-only field here

    def image_preview(self, obj):
        return format_html(
            '<img src="{}" style="max-width: 640px; max-height: 480px; border: 1px solid #ccc" />',
            obj.file.url,
        )
