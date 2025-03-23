from django.contrib import admin

from .models import Settings


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ["username"]
    readonly_fields = ("user",)

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        fields.remove("user")
        fields.insert(0, "user")
        return fields

    @admin.display(description="Username")
    def username(self, obj):
        return str(obj.user)
