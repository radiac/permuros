from django.db import models


class Image(models.Model):
    title = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    file = models.ImageField()
    width = models.IntegerField()
    height = models.IntegerField()

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title

    def as_dict(self):
        """
        Return a dict of this data; used to open the file
        """
        return {
            "url": self.file.url,
            "width": self.width,
            "height": self.height,
        }
