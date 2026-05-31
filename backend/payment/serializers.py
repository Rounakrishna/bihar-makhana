from decimal import Decimal
import re

from rest_framework import serializers

from products.catalog import calculate_catalog_total

from .models import PaymentOrder


PHONE_PATTERN = re.compile(r"^\+?\d{10,15}$")


class PaymentItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class PaymentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("9.00"))
    items = PaymentItemSerializer(many=True, required=False, allow_empty=False)

    def validate_phone(self, value):
        normalized = value.strip()
        if not PHONE_PATTERN.match(normalized):
            raise serializers.ValidationError("Enter a valid phone number.")
        return normalized

    def validate(self, attrs):
        items = attrs.get("items")
        if items:
            validated_amount = calculate_catalog_total(items)
            if attrs["amount"] != validated_amount:
                raise serializers.ValidationError(
                    {"amount": "Amount does not match the server-side cart total."}
                )
            attrs["validated_amount"] = validated_amount
        else:
            attrs["validated_amount"] = attrs["amount"]
        return attrs


class PaymentOrderDetailSerializer(serializers.ModelSerializer):
    payment_date = serializers.SerializerMethodField()

    class Meta:
        model = PaymentOrder
        fields = (
            "order_id",
            "amount",
            "transaction_id",
            "payment_status",
            "payment_gateway",
            "payment_date",
            "created_at",
            "updated_at",
        )

    def get_payment_date(self, obj):
        payment_date = obj.verified_at or obj.updated_at or obj.created_at
        return payment_date.isoformat() if payment_date else None
