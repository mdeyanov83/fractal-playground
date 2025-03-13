from django.urls import path
from . import views


urlpatterns = [
    # Page Routes
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("user_profile", views.user_profile, name="user_profile"),

    # API Routes
    path("save_mandelbrot_view", views.save_mandelbrot_view, name="save_mandelbrot_view"),
    path("delete_mandelbrot_view", views.delete_mandelbrot_view, name="delete_mandelbrot_view"),

    # No longer used, moved to routing a websockets consumer
    # path("request_render/", views.request_render, name="request_render"),

]
