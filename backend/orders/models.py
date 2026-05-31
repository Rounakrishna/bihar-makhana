from django.db import models

from payment.models import PaymentOrder


class Order(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"

    order_id = models.CharField(max_length=32, unique=True)
    payment_order = models.OneToOneField(
        PaymentOrder,
        on_delete=models.PROTECT,
        related_name="confirmed_order",
    )
    customer_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    items = models.JSONField(default=list, blank=True)
    paid_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.order_id
