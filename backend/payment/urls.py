from django.urls import path

from .views import (
    CreatePaymentRequestView,
    PaymentCsrfView,
    PaymentFailedView,
    PaymentOrderDetailView,
    PaymentSuccessView,
)

app_name = "payment"

urlpatterns = [
    path("csrf/", PaymentCsrfView.as_view(), name="payment-csrf"),
    path("create/", CreatePaymentRequestView.as_view(), name="payment-create"),
    path("success/", PaymentSuccessView.as_view(), name="payment-success"),
    path("failed/", PaymentFailedView.as_view(), name="payment-failed"),
    path("orders/<str:order_id>/", PaymentOrderDetailView.as_view(), name="payment-order-detail"),
]
