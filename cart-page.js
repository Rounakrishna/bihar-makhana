import { getCart, getCartTotal, removeCartItemByIndex } from "./cart-utils.js";
import { formatCurrency, getHomeRoute } from "./products.js";
import { initSharedSite } from "./script.js";

function renderCartPage() {
    const cartContainer = document.getElementById("cart-items-container");
    const subtotalElement = document.getElementById("subtotal");
    const totalElement = document.getElementById("total-price");
    const checkoutButton = document.getElementById("whatsapp-checkout-btn");
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
                <p class="item-price">${formatCurrency(item.price)} each</p>
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
                    <span>${formatCurrency(item.price * item.quantity)}</span>
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
    subtotalElement.textContent = formatCurrency(total);
    totalElement.textContent = formatCurrency(total);

    cartContainer.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-index]");
        if (!removeButton) return;

        const index = Number(removeButton.getAttribute("data-remove-index"));
        removeCartItemByIndex(index);
        renderCartPage();
    }, { once: true });

    checkoutButton.addEventListener("click", () => {
        const activeCart = getCart();
        if (activeCart.length === 0) return;

        let message = "Hello, I would like to place an order:\n\n";
        activeCart.forEach((item) => {
            message += `- ${item.name} (${formatCurrency(item.price)} x ${item.quantity})\n`;
        });
        message += `\n*Total Amount: ${formatCurrency(getCartTotal(activeCart))}*`;
        message += "\n\nPlease confirm my order.";

        window.open(`https://wa.me/919728980251?text=${encodeURIComponent(message)}`, "_blank");
    }, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
    initSharedSite();
    renderCartPage();
});
