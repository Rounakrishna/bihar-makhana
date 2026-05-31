from django.contrib import admin

from .models import PaymentOrder


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "customer_name",
        "amount",
        "payment_status",
        "transaction_id",
        "created_at",
    )
    list_filter = ("payment_status", "payment_gateway", "created_at")
    search_fields = (
        "order_id",
        "customer_name",
        "email",
        "phone",
        "payment_request_id",
        "transaction_id",
    )
    readonly_fields = (
        "payment_request_id",
        "transaction_id",
        "gateway_response",
        "verified_at",
        "created_at",
        "updated_at",
    )
