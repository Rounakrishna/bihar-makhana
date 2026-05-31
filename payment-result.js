import { clearCart } from "./cart-utils.js";
import {
    clearCheckoutCustomer,
    formatPaymentAmount,
    formatPaymentDate,
    getPaymentApiUrl,
} from "./payment-utils.js";
import { getCartRoute, getHomeRoute } from "./products.js";
import { initSharedSite } from "./script.js";

function getResultElements() {
    return {
        detailList: document.getElementById("payment-detail-list"),
        retryButton: document.getElementById("retry-payment-btn"),
        cartButton: document.getElementById("return-cart-btn"),
        homeButton: document.getElementById("return-home-btn"),
    };
}

function renderDetails(data, isSuccess) {
    const { detailList } = getResultElements();
    if (!detailList) return;

    const detailRows = [
        ["Order ID", data.order_id || "NA"],
        ["Amount", formatPaymentAmount(data.amount)],
        ["Transaction ID", data.transaction_id || (isSuccess ? "Pending verification" : "NA")],
        ["Payment Date", formatPaymentDate(data.payment_date || data.updated_at || data.created_at)],
        ["Status", data.payment_status || (isSuccess ? "SUCCESS" : "FAILED")],
    ];

    detailList.innerHTML = detailRows
        .map(
            ([label, value]) => `
                <div class="payment-detail-row">
                    <span>${label}</span>
                    <strong>${value}</strong>
                </div>
            `
        )
        .join("");
}

function renderFallbackMessage(orderId, isSuccess) {
    renderDetails(
        {
            order_id: orderId || "NA",
            amount: new URLSearchParams(window.location.search).get("amount") || 0,
            transaction_id: new URLSearchParams(window.location.search).get("transaction_id") || "",
            payment_date: new URLSearchParams(window.location.search).get("payment_date") || "",
            payment_status: isSuccess ? "SUCCESS" : "FAILED",
        },
        isSuccess
    );
}

async function hydrateResultPage() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    const isSuccess = document.body.dataset.paymentResult === "success";

    if (!orderId) {
        renderFallbackMessage("", isSuccess);
        return;
    }

    try {
        const response = await fetch(getPaymentApiUrl(`/api/payment/orders/${orderId}/`), {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Could not load payment details.");
        }

        const data = await response.json();

        if (isSuccess && data.payment_status === "SUCCESS") {
            clearCart();
            clearCheckoutCustomer();
        }

        renderDetails(data, isSuccess);
    } catch (error) {
        renderFallbackMessage(orderId, isSuccess);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initSharedSite();

    const rootPath = document.body.dataset.rootPath || "";
    const { retryButton, cartButton, homeButton } = getResultElements();
    const cartUrl = getCartRoute(rootPath);
    const homeUrl = getHomeRoute(rootPath);

    if (retryButton) retryButton.setAttribute("href", cartUrl);
    if (cartButton) cartButton.setAttribute("href", cartUrl);
    if (homeButton) homeButton.setAttribute("href", homeUrl);

    hydrateResultPage();
});
