import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("payment", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order_id", models.CharField(max_length=32, unique=True)),
                ("customer_name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("transaction_id", models.CharField(max_length=255, unique=True)),
                ("status", models.CharField(choices=[("SUCCESS", "Success")], default="SUCCESS", max_length=20)),
                ("items", models.JSONField(blank=True, default=list)),
                ("paid_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "payment_order",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="confirmed_order",
                        to="payment.paymentorder",
                    ),
                ),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
