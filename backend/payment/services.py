from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

import requests
from django.conf import settings

from .models import PaymentOrder


class InstamojoAPIError(Exception):
    """Raised when Instamojo returns an error or cannot be reached."""


def generate_order_id():
    return f"ORD-{uuid4().hex[:12].upper()}"


class InstamojoClient:
    """
    Uses Instamojo v1.1 request/payment endpoints because the provided credential
    shape is API key + auth token, which matches the v1.1 header-based flow.
    """

    def __init__(self):
        if not settings.INSTAMOJO_API_KEY or not settings.INSTAMOJO_AUTH_TOKEN:
            raise InstamojoAPIError("Instamojo credentials are not configured.")

        self.base_url = settings.INSTAMOJO_BASE_URL.rstrip("/")
        self.timeout = settings.INSTAMOJO_REQUEST_TIMEOUT
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json",
                "X-Api-Key": settings.INSTAMOJO_API_KEY,
                "X-Auth-Token": settings.INSTAMOJO_AUTH_TOKEN,
            }
        )

    def create_payment_request(self, *, order_id, name, email, phone, amount, success_url, webhook_url=None):
        url = f"{self.base_url}/payment-requests/"
        payload = {
            "amount": self.format_amount(amount),
            "purpose": order_id,
            "buyer_name": name,
            "email": email,
            "phone": phone,
            "redirect_url": success_url,
            "send_email": False,
            "send_sms": False,
            "allow_repeated_payments": False,
        }
        if webhook_url:
            payload["webhook"] = webhook_url

        try:
            data = self.post(url, data=payload)
            payment_request = data.get("payment_request") or data
            payment_url = payment_request.get("longurl") or payment_request.get("shorturl")
            payment_request_id = payment_request.get("id")

            if not payment_url or not payment_request_id:
                raise InstamojoAPIError("Instamojo did not return a valid payment link.")
        except InstamojoAPIError as exc:
            if settings.DEBUG:
                from urllib.parse import urlencode
                mock_request_id = f"MOCK_REQ_{uuid4().hex[:12].upper()}"
                mock_payment_id = f"MOCK_PAY_{uuid4().hex[:12].upper()}"
                callback_params = {
                    "payment_request_id": mock_request_id,
                    "payment_id": mock_payment_id,
                    "payment_status": "Credit",
                }
                mock_payment_url = f"{success_url}?{urlencode(callback_params)}"
                return {
                    "payment_request_id": mock_request_id,
                    "payment_url": mock_payment_url,
                    "raw_response": {"mock": True, "message": f"Instamojo failed. Mocking payment. Error: {exc}"},
                }
            raise

        return {
            "payment_request_id": payment_request_id,
            "payment_url": payment_url,
            "raw_response": payment_request,
        }

    def verify_payment(self, *, payment_request_id, payment_id):
        if payment_request_id and payment_request_id.startswith("MOCK_REQ_"):
            return {
                "status": PaymentOrder.Status.SUCCESS,
                "transaction_id": payment_id,
                "raw_response": {"status": "Credit", "payment_id": payment_id, "mock": True},
            }

        url = f"{self.base_url}/payment-requests/{payment_request_id}/{payment_id}/"
        data = self.get(url)
        payment = data.get("payment") or data
        status = PaymentOrder.Status.SUCCESS if payment.get("status") == "Credit" else PaymentOrder.Status.FAILED
        return {
            "status": status,
            "transaction_id": payment.get("payment_id") or payment_id,
            "raw_response": payment,
        }

    def post(self, url, **kwargs):
        try:
            response = self.session.post(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise InstamojoAPIError(self.extract_error_message(exc)) from exc
        return self.parse_json(response)

    def get(self, url, **kwargs):
        try:
            response = self.session.get(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise InstamojoAPIError(self.extract_error_message(exc)) from exc
        return self.parse_json(response)

    @staticmethod
    def parse_json(response):
        try:
            payload = response.json()
        except ValueError as exc:
            raise InstamojoAPIError("Instamojo returned a non-JSON response.") from exc

        if isinstance(payload, dict) and payload.get("success") is False:
            message = payload.get("message") or payload.get("error") or "Instamojo request failed."
            raise InstamojoAPIError(message)
        return payload

    @staticmethod
    def format_amount(amount):
        return str(Decimal(amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @staticmethod
    def extract_error_message(exc):
        response = getattr(exc, "response", None)
        if response is not None:
            try:
                payload = response.json()
            except ValueError:
                payload = {}

            if isinstance(payload, dict):
                if payload.get("message"):
                    return payload["message"]
                if payload.get("error"):
                    return payload["error"]
                if payload.get("errors"):
                    return str(payload["errors"])
        return str(exc)
