from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "customer_name",
        "amount",
        "transaction_id",
        "paid_at",
        "created_at",
    )
    search_fields = ("order_id", "customer_name", "email", "transaction_id")
    readonly_fields = ("created_at", "updated_at", "paid_at")
