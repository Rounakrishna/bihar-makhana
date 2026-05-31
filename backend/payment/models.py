from django.db import models


class PaymentOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    class Gateway(models.TextChoices):
        INSTAMOJO = "INSTAMOJO", "Instamojo"

    order_id = models.CharField(max_length=32, unique=True)
    customer_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_request_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    payment_gateway = models.CharField(
        max_length=32,
        choices=Gateway.choices,
        default=Gateway.INSTAMOJO,
    )
    items = models.JSONField(default=list, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.order_id} - {self.payment_status}"
