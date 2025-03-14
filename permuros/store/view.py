from django import forms
from django.http import JsonResponse

from .models import Store

STATUS_OK = "ok"
STATUS_ERROR = "error"


def api_get(request, app: str, key: str):
    try:
        obj = Store.objects.get(app=app, key=key)
    except Store.DoesNotExist:
        obj = None

    if not obj:
        return JsonResponse(
            {"status": STATUS_ERROR, "message": "Record not found"},
            status=404,
        )

    return JsonResponse(
        {
            "status": STATUS_OK,
            "created": obj.created,
            "modified": obj.modified,
            "value": obj.value,
        }
    )


class PostData(forms.Form):
    app = forms.SlugField()
    key = forms.SlugField()
    value = forms.CharField(required=False)


def api_set(request):
    form = PostData(request.POST)
    if not form.is_valid():
        return JsonResponse(
            {
                "status": STATUS_ERROR,
                "message": f"Invalid request: {form.errors.as_text()}",
            },
            status=400,
        )

    Store.objects.update_or_create(app=form.app, key=form.key, value=form.value)
    return JsonResponse({"status": STATUS_OK, "message": "Record saved"})
