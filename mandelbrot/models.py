from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    def serialize(self):
        return {
            "username": self.username,
            "email": self.email,
            "total_favorite_views": MandelbrotView.objects.filter(user=self).count(),  # Number of saved views
            "favorite_views": [view.serialize() for view in MandelbrotView.objects.filter(user=self)],
        }

class MandelbrotView(models.Model):
    VIEW_TYPE_CHOICES = [
        ("user_defined", "User Defined"),
        ("predefined", "Predefined"),
    ]

    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_mandelbrot_views", null=True, blank=True)
    name = models.CharField(blank=False, null=False, max_length=128)
    center_x = models.FloatField(blank=False, null=False)
    center_y = models.FloatField(blank=False, null=False)
    zoom = models.FloatField(blank=False, null=False)
    max_iterations = models.IntegerField(blank=False, null=False)
    view_type = models.CharField(max_length=20, choices=VIEW_TYPE_CHOICES, default="user_defined")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "center_x": self.center_x,
            "center_y": self.center_y,
            "zoom": self.zoom,
            "max_iterations": self.max_iterations,
            "view_type": self.view_type,
        }





