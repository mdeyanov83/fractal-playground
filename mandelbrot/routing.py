from django.urls import re_path
from mandelbrot.consumers import MandelbrotProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/progress/$", MandelbrotProgressConsumer.as_asgi()),
]
