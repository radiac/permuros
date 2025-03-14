from typing import Any

from django import forms
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import DetailView, TemplateView

from .models import File


class WordMixin(LoginRequiredMixin):
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context.update(
            files=File.objects.all(),
        )
        return context


class AppView(WordMixin, TemplateView):
    """
    Primary app view
    """

    template_name = "write/app.html"


class OpenView(WordMixin, DetailView):
    """
    Open or create a document
    """

    model = File
    context_object_name = "file"
    template_name = "write/htmx/open.html"


class FileForm(forms.ModelForm):
    class Meta:
        model = File
        fields = ["title", "content"]


class SaveView(WordMixin, TemplateView):
    """
    Save a document
    """

    template_name = "write/htmx/save.html"

    def post(self, request):
        pk = request.POST.get("pk")
        file = None
        if pk:
            try:
                file = File.objects.get(pk=pk)
            except File.DoesNotExist:
                pass

        form = FileForm(request.POST, instance=file)
        if form.is_valid():
            file = form.save()
        else:
            print(form.errors)

        context = self.get_context_data(file=file)
        return self.render_to_response(context)


'''
class DeleteView(WordView):
    """
    Delete a document
    """
'''
