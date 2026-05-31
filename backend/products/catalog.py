from decimal import Decimal

from rest_framework import serializers


PRODUCT_CATALOG = {
    "1": {"name": "Premium Whole Makhana", "price": Decimal("450.00")},
    "2": {"name": "Roasted Makhana", "price": Decimal("520.00")},
    "3": {"name": "Flavored Makhana Mix", "price": Decimal("580.00")},
    "4": {"name": "Organic Raw Makhana", "price": Decimal("600.00")},
}


def calculate_catalog_total(items):
    total = Decimal("0.00")
    normalized_items = []

    for item in items:
        product_id = str(item["id"])
        quantity = int(item["quantity"])
        product = PRODUCT_CATALOG.get(product_id)
        if not product:
            raise serializers.ValidationError({"items": f"Unknown product id: {product_id}"})

        line_total = product["price"] * quantity
        total += line_total
        normalized_items.append(
            {
                "id": product_id,
                "name": product["name"],
                "price": str(product["price"]),
                "quantity": quantity,
                "line_total": str(line_total),
            }
        )

    items.clear()
    items.extend(normalized_items)
    return total
