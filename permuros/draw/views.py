import base64
from typing import Any

from django import forms
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.files.base import ContentFile
from django.shortcuts import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.views.generic import DetailView, TemplateView

from .models import Image


class DrawMixin(LoginRequiredMixin):
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context.update(
            images=Image.objects.all(),
        )
        return context


class AppView(DrawMixin, TemplateView):
    """
    Primary app view
    """

    template_name = "draw/app.html"


class OpenView(DrawMixin, DetailView):
    """
    Open or create a document
    """

    model = Image
    context_object_name = "image"
    template_name = "draw/htmx/open.html"


class ImageForm(forms.ModelForm):
    image_data = forms.CharField()

    class Meta:
        model = Image
        fields = ["title", "width", "height"]


class SaveView(DrawMixin, TemplateView):
    """
    Save a document
    """

    template_name = "draw/htmx/save.html"

    def post(self, request):
        pk = request.POST.get("pk")
        image = None
        if pk:
            try:
                image = Image.objects.get(pk=pk)
            except Image.DoesNotExist:
                pass

        form = ImageForm(request.POST, instance=image)
        if form.is_valid():
            image_data_uri = form.cleaned_data["image_data"]

            # Convert base64 url into filetype and raw image
            image_type, image_data = image_data_uri.split(";base64,")
            ext = image_type.split("/")[1]
            if ext != "png":
                raise ValueError(f"Unexpected file extension {ext}")
            image_data = base64.b64decode(image_data)

            # Save the image
            image_file = ContentFile(image_data, name="image.png")

            # Save the image to your model
            slug = slugify(form.cleaned_data["title"])[:-20]
            filename = f"{timezone.now().strftime('%Y-%m-%d')}-{slug}.png"
            image = form.save(commit=False)
            image.file.save(
                filename, image_file
            )  # Replace 'image_field' with your actual field name
            image.save()
        else:
            print(form.errors)

        context = self.get_context_data(image=image)
        return self.render_to_response(context)


'''
class DeleteView(WordView):
    """
    Delete a document
    """
'''
