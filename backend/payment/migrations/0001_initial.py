from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PaymentOrder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order_id", models.CharField(max_length=32, unique=True)),
                ("customer_name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("payment_request_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("transaction_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                (
                    "payment_status",
                    models.CharField(
                        choices=[("PENDING", "Pending"), ("SUCCESS", "Success"), ("FAILED", "Failed")],
                        db_index=True,
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                (
                    "payment_gateway",
                    models.CharField(
                        choices=[("INSTAMOJO", "Instamojo")],
                        default="INSTAMOJO",
                        max_length=32,
                    ),
                ),
                ("items", models.JSONField(blank=True, default=list)),
                ("gateway_response", models.JSONField(blank=True, default=dict)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("-created_at",)},
        ),
    ]
