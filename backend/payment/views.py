from urllib.parse import urlencode

from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order

from .models import PaymentOrder
from .serializers import PaymentCreateSerializer, PaymentOrderDetailSerializer
from .services import InstamojoAPIError, InstamojoClient, generate_order_id


def build_frontend_redirect(base_url, **params):
    filtered_params = {key: value for key, value in params.items() if value not in (None, "", [])}
    if not filtered_params:
        return base_url
    return f"{base_url}?{urlencode(filtered_params)}"


def merge_gateway_response(payment_order, payload):
    merged = dict(payment_order.gateway_response or {})
    merged.update(payload or {})
    return merged


def serialize_order_items(payment_order):
    return payment_order.items if isinstance(payment_order.items, list) else []


@method_decorator(ensure_csrf_cookie, name="dispatch")
class PaymentCsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


@method_decorator(csrf_protect, name="dispatch")
class CreatePaymentRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_amount = serializer.validated_data["validated_amount"]
        order_id = generate_order_id()
        callback_url = request.build_absolute_uri("/api/payment/success/")

        referer = request.META.get("HTTP_REFERER")
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            frontend_origin = f"{parsed.scheme}://{parsed.netloc}"
        else:
            frontend_origin = settings.FRONTEND_URL

        try:
            gateway_response = InstamojoClient().create_payment_request(
                order_id=order_id,
                name=serializer.validated_data["name"],
                email=serializer.validated_data["email"],
                phone=serializer.validated_data["phone"],
                amount=validated_amount,
                success_url=callback_url,
            )
        except InstamojoAPIError as exc:
            raise serializers.ValidationError({"gateway": str(exc)}) from exc

        raw_resp = gateway_response.get("raw_response") or {}
        if isinstance(raw_resp, dict):
            raw_resp["frontend_origin"] = frontend_origin

        payment_order = PaymentOrder.objects.create(
            order_id=order_id,
            customer_name=serializer.validated_data["name"],
            email=serializer.validated_data["email"],
            phone=serializer.validated_data["phone"],
            amount=validated_amount,
            payment_request_id=gateway_response["payment_request_id"],
            payment_status=PaymentOrder.Status.PENDING,
            items=serializer.validated_data.get("items", []),
            gateway_response=raw_resp,
        )

        return Response(
            {
                "order_id": payment_order.order_id,
                "payment_url": gateway_response["payment_url"],
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentOrderDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        payment_order = PaymentOrder.objects.filter(order_id=order_id).first()
        if not payment_order:
            return Response({"detail": "Payment order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(PaymentOrderDetailSerializer(payment_order).data)


class PaymentSuccessView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payment_request_id = request.query_params.get("payment_request_id")
        payment_id = request.query_params.get("payment_id")
        payment_status = request.query_params.get("payment_status", "")

        payment_order = PaymentOrder.objects.filter(payment_request_id=payment_request_id).first()
        if not payment_order:
            failed_url = build_frontend_redirect(
                settings.PAYMENT_FAILED_FRONTEND_URL,
                reason="unknown_order",
                payment_request_id=payment_request_id,
            )
            return HttpResponseRedirect(failed_url)

        frontend_origin = (payment_order.gateway_response or {}).get("frontend_origin")
        if frontend_origin:
            success_base_url = f"{frontend_origin.rstrip('/')}/payment/success/"
        else:
            success_base_url = settings.PAYMENT_SUCCESS_FRONTEND_URL

        if payment_order.payment_status == PaymentOrder.Status.SUCCESS and payment_order.transaction_id:
            success_url = build_frontend_redirect(
                success_base_url,
                order_id=payment_order.order_id,
                amount=payment_order.amount,
                transaction_id=payment_order.transaction_id,
                payment_date=payment_order.verified_at.isoformat() if payment_order.verified_at else None,
            )
            return HttpResponseRedirect(success_url)

        if payment_status.lower() != "credit" or not payment_id:
            self.mark_payment_failed(
                payment_order,
                {
                    "payment_status": payment_status,
                    "payment_request_id": payment_request_id,
                    "payment_id": payment_id,
                },
            )
            return HttpResponseRedirect(self.build_failed_redirect(payment_order, reason="payment_failed"))

        try:
            verification = InstamojoClient().verify_payment(
                payment_request_id=payment_request_id,
                payment_id=payment_id,
            )
        except InstamojoAPIError:
            self.mark_payment_failed(
                payment_order,
                {
                    "payment_status": payment_status,
                    "payment_request_id": payment_request_id,
                    "payment_id": payment_id,
                    "verification_error": "Unable to verify payment with Instamojo.",
                },
            )
            return HttpResponseRedirect(self.build_failed_redirect(payment_order, reason="verification_failed"))

        if verification["status"] != PaymentOrder.Status.SUCCESS:
            self.mark_payment_failed(payment_order, verification["raw_response"])
            return HttpResponseRedirect(self.build_failed_redirect(payment_order, reason="payment_not_captured"))

        confirmed_order = self.mark_payment_success(payment_order, verification)
        success_url = build_frontend_redirect(
            success_base_url,
            order_id=payment_order.order_id,
            amount=payment_order.amount,
            transaction_id=payment_order.transaction_id,
            payment_date=payment_order.verified_at.isoformat() if payment_order.verified_at else None,
            confirmed_order_id=confirmed_order.order_id,
        )
        return HttpResponseRedirect(success_url)

    @transaction.atomic
    def mark_payment_success(self, payment_order, verification):
        payment_order.transaction_id = verification["transaction_id"]
        payment_order.payment_status = PaymentOrder.Status.SUCCESS
        payment_order.verified_at = timezone.now()
        payment_order.gateway_response = merge_gateway_response(payment_order, verification["raw_response"])
        payment_order.save(
            update_fields=[
                "transaction_id",
                "payment_status",
                "verified_at",
                "gateway_response",
                "updated_at",
            ]
        )

        order, _ = Order.objects.get_or_create(
            payment_order=payment_order,
            defaults={
                "order_id": payment_order.order_id,
                "customer_name": payment_order.customer_name,
                "email": payment_order.email,
                "phone": payment_order.phone,
                "amount": payment_order.amount,
                "transaction_id": payment_order.transaction_id,
                "items": serialize_order_items(payment_order),
                "paid_at": payment_order.verified_at or timezone.now(),
            },
        )
        return order

    @transaction.atomic
    def mark_payment_failed(self, payment_order, payload):
        if payment_order.payment_status == PaymentOrder.Status.SUCCESS:
            return

        payment_order.payment_status = PaymentOrder.Status.FAILED
        payment_order.gateway_response = merge_gateway_response(payment_order, payload)
        payment_order.save(update_fields=["payment_status", "gateway_response", "updated_at"])

    def build_failed_redirect(self, payment_order, reason):
        frontend_origin = (payment_order.gateway_response or {}).get("frontend_origin")
        if frontend_origin:
            failed_base_url = f"{frontend_origin.rstrip('/')}/payment/failed/"
        else:
            failed_base_url = settings.PAYMENT_FAILED_FRONTEND_URL

        return build_frontend_redirect(
            failed_base_url,
            order_id=payment_order.order_id,
            amount=payment_order.amount,
            transaction_id=payment_order.transaction_id,
            reason=reason,
        )


class PaymentFailedView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payment_request_id = request.query_params.get("payment_request_id")
        payment_id = request.query_params.get("payment_id")
        payment_status = request.query_params.get("payment_status", "Failed")

        payment_order = PaymentOrder.objects.filter(payment_request_id=payment_request_id).first()
        if payment_order and payment_order.payment_status != PaymentOrder.Status.SUCCESS:
            payment_order.payment_status = PaymentOrder.Status.FAILED
            payment_order.gateway_response = merge_gateway_response(
                payment_order,
                {
                    "payment_status": payment_status,
                    "payment_request_id": payment_request_id,
                    "payment_id": payment_id,
                },
            )
            payment_order.save(update_fields=["payment_status", "gateway_response", "updated_at"])

        frontend_origin = (payment_order.gateway_response or {}).get("frontend_origin") if payment_order else None
        if frontend_origin:
            failed_base_url = f"{frontend_origin.rstrip('/')}/payment/failed/"
        else:
            failed_base_url = settings.PAYMENT_FAILED_FRONTEND_URL

        failed_url = build_frontend_redirect(
            failed_base_url,
            order_id=payment_order.order_id if payment_order else None,
            amount=payment_order.amount if payment_order else None,
            transaction_id=payment_order.transaction_id if payment_order else None,
        )
        return HttpResponseRedirect(failed_url)
