from django.contrib import admin

from .models import User, MandelbrotView

# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "id")
    readonly_fields = ("id",)

class MandelbrotViewAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "view_type")


admin.site.register(User, UserAdmin)
admin.site.register(MandelbrotView, MandelbrotViewAdmin)
