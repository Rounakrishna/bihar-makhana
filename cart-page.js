import { getCart, getCartTotal, removeCartItemByIndex } from "./cart-utils.js";
import { saveCheckoutCustomer, getCheckoutCustomer, ensurePaymentCsrf, getPaymentApiUrl } from "./payment-utils.js";
import { getHomeRoute } from "./products.js";
import { initSharedSite } from "./script.js";

function setFeedback(message = "", type = "") {
    const feedbackElement = document.getElementById("payment-feedback");
    if (!feedbackElement) return;

    feedbackElement.textContent = message;
    feedbackElement.className = `payment-status-message${type ? ` ${type}` : ""}`;
}

function getCustomerDetails() {
    const nameInput = document.getElementById("customer-name");
    const emailInput = document.getElementById("customer-email");
    const phoneInput = document.getElementById("customer-phone");

    if (!nameInput || !emailInput || !phoneInput) return null;

    const customer = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
    };

    if (!customer.name) {
        nameInput.reportValidity();
        nameInput.focus();
        return null;
    }

    if (!emailInput.checkValidity()) {
        emailInput.reportValidity();
        emailInput.focus();
        return null;
    }

    if (!phoneInput.value.trim()) {
        phoneInput.reportValidity();
        phoneInput.focus();
        return null;
    }

    return customer;
}

function prefillCustomerDetails() {
    const customer = getCheckoutCustomer();
    if (!customer) return;

    const nameInput = document.getElementById("customer-name");
    const emailInput = document.getElementById("customer-email");
    const phoneInput = document.getElementById("customer-phone");

    if (nameInput) nameInput.value = customer.name || "";
    if (emailInput) emailInput.value = customer.email || "";
    if (phoneInput) phoneInput.value = customer.phone || "";
}

async function startPayment(checkoutButton) {
    const activeCart = getCart();
    if (!activeCart.length) return;

    const customer = getCustomerDetails();
    if (!customer) return;

    const originalLabel = checkoutButton.innerHTML;
    checkoutButton.disabled = true;
    checkoutButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Redirecting...';
    setFeedback("Preparing your secure payment session...", "info");

    try {
        saveCheckoutCustomer(customer);
        const csrfToken = await ensurePaymentCsrf();

        const response = await fetch(getPaymentApiUrl("/api/payment/create/"), {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({
                ...customer,
                amount: getCartTotal(activeCart),
                items: activeCart.map((item) => ({
                    id: item.id,
                    quantity: Number(item.quantity),
                })),
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.payment_url) {
            const getErrorMsg = (val) => {
                if (!val) return null;
                return Array.isArray(val) ? val[0] : val;
            };
            const errorMessage =
                getErrorMsg(data?.amount) ||
                getErrorMsg(data?.phone) ||
                getErrorMsg(data?.gateway) ||
                data?.detail ||
                "We could not start the payment request. Please try again.";
            throw new Error(errorMessage);
        }

        window.location.href = data.payment_url;
    } catch (error) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = originalLabel;
        setFeedback(error.message || "Unable to proceed to payment.", "error");
    }
}

function renderCartPage() {
    const cartContainer = document.getElementById("cart-items-container");
    const subtotalElement = document.getElementById("subtotal");
    const totalElement = document.getElementById("total-price");
    const checkoutButton = document.getElementById("proceed-payment-btn");
    const summaryPanel = document.querySelector(".cart-summary");
    const rootPath = document.body.dataset.rootPath || "";

    if (!cartContainer || !subtotalElement || !totalElement || !checkoutButton || !summaryPanel) return;

    const cart = getCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-msg cart-empty-state">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty.</p>
                <a href="${getHomeRoute(rootPath)}#products" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        summaryPanel.style.display = "none";
        return;
    }

    summaryPanel.style.display = "block";
    cartContainer.innerHTML = "";

    cart.forEach((item, index) => {
        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";
        itemElement.innerHTML = `
            <div class="item-image">
                <img src="${rootPath}${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <p class="item-price">Rs. ${item.price} / kg</p>
                <p class="item-quantity">Quantity: ${item.quantity}</p>
            </div>
            <div class="item-actions">
                <button type="button" class="remove-btn" data-remove-index="${index}" aria-label="Remove ${item.name} from cart">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(itemElement);
    });

    const summaryRows = cart
        .map(
            (item) => `
                <div class="summary-line-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>Rs. ${item.price * item.quantity}</span>
                </div>
            `
        )
        .join("");

    const existingSummaryDetails = summaryPanel.querySelector(".summary-details");
    if (existingSummaryDetails) existingSummaryDetails.remove();

    const summaryDetails = document.createElement("div");
    summaryDetails.className = "summary-details";
    summaryDetails.innerHTML = summaryRows;
    summaryPanel.insertBefore(summaryDetails, summaryPanel.querySelector(".summary-row"));

    const total = getCartTotal(cart);
    subtotalElement.textContent = `Rs. ${total}`;
    totalElement.textContent = `Rs. ${total}`;

    cartContainer.onclick = (event) => {
        const removeButton = event.target.closest("[data-remove-index]");
        if (!removeButton) return;

        const index = Number(removeButton.getAttribute("data-remove-index"));
        removeCartItemByIndex(index);
        renderCartPage();
    };

    checkoutButton.onclick = () => {
        startPayment(checkoutButton);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    initSharedSite();
    prefillCustomerDetails();
    renderCartPage();
});
