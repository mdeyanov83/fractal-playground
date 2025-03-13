import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, MandelbrotView


def index(request):
    if request.user.is_authenticated:
        return render(request, "mandelbrot/index.html", {
            "current_user": User.objects.get(username=request.user).serialize(),
            "popular_views": MandelbrotView.objects.filter(view_type="predefined"),
        })
    else:
        return render(request, "mandelbrot/index.html", {
            "popular_views": MandelbrotView.objects.filter(view_type="predefined"),
        })


def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authenticatio successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mandelbrot/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "mandelbrot/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password and password confirmation match
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "mandelbrot/register.html", {
                "message": "Passwords must match."
            })
        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "mandelbrot/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mandelbrot/register.html")


@login_required
def user_profile(request):
    return render(request, "mandelbrot/user_profile.html", {
        "current_user": User.objects.get(username=request.user).serialize(),
    })


@login_required
def save_mandelbrot_view(request):
    # Create a new view must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request requried."}, status=400)

    data = json.loads(request.body)

    view_name = data.get("view_name", "")
    if view_name == "":
        return JsonResponse({"error": "View name cannot be empty."}, status=400)

    user = request.user
    if MandelbrotView.objects.filter(user=user, name=view_name).exists():
        return JsonResponse({"error": "A view with this name already exists"}, status=400)

    # Extract and validate numerical values
    try:
        center_x = float(data.get("center_x"))
        center_y = float(data.get("center_y"))
        zoom = float(data.get("zoom"))
        max_iterations = int(data.get("max_iterations"))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid numerical values."}, status=400)

    # Save new Mandelbrot view
    view = MandelbrotView(
        user=user,
        name=view_name,
        center_x=center_x,
        center_y=center_y,
        zoom=zoom,
        max_iterations=max_iterations,
    )
    view.save()
    return JsonResponse({"message": "New favorite view saved successfully."}, status=201)


@login_required
def delete_mandelbrot_view(request):
    # Delet view must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request requried."}, status=400)

    data = json.loads(request.body)
    view_id = int(data.get("view_id"))
    view = MandelbrotView.objects.get(id=view_id)
    view.delete()
    return JsonResponse({"message": "View deleted."}, status=200)
