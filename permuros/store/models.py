from django.db import models


class Store(models.Model):
    app = models.SlugField()
    key = models.SlugField()
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    value = models.TextField(blank=True)
