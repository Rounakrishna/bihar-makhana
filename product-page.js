import { addToCart, getCartCount, isProductInCart } from "./cart-utils.js";
import {
    createRelatedProductCard,
    getRootPath,
    initHomePage,
    initSharedSite,
    showToast
} from "./script.js";
import {
    formatCurrency,
    getCartRoute,
    getHomeRoute,
    getProductById,
    getProductRoute,
    getRelatedProducts,
    resolveAsset
} from "./products.js";

function buildSkeleton() {
    return `
        <section class="pdp-breadcrumb">
            <div class="container">
                <div class="pdp-skeleton pdp-skeleton-text pdp-skeleton-breadcrumb"></div>
            </div>
        </section>
        <section class="pdp-main">
            <div class="container">
                <div class="pdp-layout">
                    <div class="pdp-gallery-column">
                        <div class="pdp-skeleton pdp-skeleton-image"></div>
                        <div class="pdp-thumbnail-row">
                            ${Array.from({ length: 4 })
        .map(() => '<div class="pdp-skeleton pdp-skeleton-thumb"></div>')
        .join("")}
                        </div>
                    </div>
                    <div class="pdp-content-column">
                        <div class="pdp-skeleton pdp-skeleton-text pdp-skeleton-title"></div>
                        <div class="pdp-skeleton pdp-skeleton-text pdp-skeleton-subtitle"></div>
                        <div class="pdp-skeleton pdp-skeleton-text pdp-skeleton-copy"></div>
                        <div class="pdp-skeleton pdp-skeleton-text pdp-skeleton-copy"></div>
                        <div class="pdp-skeleton pdp-skeleton-button"></div>
                        <div class="pdp-skeleton pdp-skeleton-button"></div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function buildStars(rating) {
    const roundedRating = Math.round(rating);
    return Array.from({ length: 5 }, (_, index) => {
        const icon = index < roundedRating ? "fa-solid fa-star" : "fa-regular fa-star";
        return `<i class="${icon}"></i>`;
    }).join("");
}

function buildTabPanel(tabId, title, content) {
    return `
        <div class="pdp-tab-panel" data-tab-panel="${tabId}">
            <h3>${title}</h3>
            ${content}
        </div>
    `;
}

function buildProductPage(product, rootPath) {
    const galleryMarkup = product.gallery
        .map(
            (image, index) => `
                <button class="pdp-thumb${index === 0 ? " active" : ""}" type="button" data-gallery-image="${resolveAsset(rootPath, image)}">
                    <img src="${resolveAsset(rootPath, image)}" alt="${product.name} thumbnail ${index + 1}">
                </button>
            `
        )
        .join("");

    const descriptionContent = `
        <div class="pdp-rich-copy">
            ${product.description.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            <div class="pdp-list-grid">
                <div>
                    <h4>Product Benefits</h4>
                    <ul>${product.benefits.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h4>Usage Information</h4>
                    <ul>${product.usage.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h4>Storage Instructions</h4>
                    <ul>${product.storage.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
            </div>
        </div>
    `;

    const specificationsContent = `
        <div class="pdp-table-wrap">
            <table class="pdp-data-table">
                <tbody>
                    ${Object.entries(product.specifications)
        .map(
            ([label, value]) => `
                                <tr>
                                    <th>${label}</th>
                                    <td>${value}</td>
                                </tr>
                            `
        )
        .join("")}
                </tbody>
            </table>
        </div>
    `;

    const nutritionContent = `
        <div class="pdp-table-wrap">
            <table class="pdp-data-table">
                <tbody>
                    ${Object.entries(product.nutrition)
        .map(
            ([label, value]) => `
                                <tr>
                                    <th>${label}</th>
                                    <td>${value}</td>
                                </tr>
                            `
        )
        .join("")}
                </tbody>
            </table>
        </div>
    `;

    const shippingContent = `
        <div class="pdp-rich-copy">
            <ul>${product.shipping.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
    `;

    const relatedProductsMarkup = getRelatedProducts(product.id)
        .map((relatedProduct) => createRelatedProductCard(relatedProduct, rootPath))
        .join("");

    return `
        <section class="pdp-breadcrumb">
            <div class="container">
                <nav class="breadcrumb-nav" aria-label="Breadcrumb">
                    <a href="${getHomeRoute(rootPath)}">Home</a>
                    <span><i class="fa-solid fa-angle-right"></i></span>
                    <a href="${getHomeRoute(rootPath)}#products">Products</a>
                    <span><i class="fa-solid fa-angle-right"></i></span>
                    <span>${product.name}</span>
                </nav>
            </div>
        </section>

        <section class="pdp-main">
            <div class="container">
                <div class="pdp-layout">
                    <div class="pdp-gallery-column">
                        <div class="pdp-main-visual">
                            <div class="pdp-main-image">
                                <img id="pdp-main-image" src="${resolveAsset(rootPath, product.gallery[0])}" alt="${product.name}">
                            </div>
                        </div>
                        <div class="pdp-thumbnail-row">${galleryMarkup}</div>
                    </div>

                    <div class="pdp-content-column">
                        <div class="pdp-top-meta">
                            <span class="pdp-badge">${product.badge}</span>
                            <span class="pdp-stock${product.stock > 0 ? " in-stock" : " out-of-stock"}">
                                <i class="fa-solid ${product.stock > 0 ? "fa-circle-check" : "fa-circle-xmark"}"></i>
                                ${product.stock > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                        </div>

                        <h1 class="pdp-title">${product.name}</h1>

                        <div class="pdp-rating-row">
                            <div class="pdp-stars">${buildStars(product.rating)}</div>
                            <strong>${product.rating.toFixed(1)}</strong>
                            <span>(${product.reviewCount} reviews)</span>
                        </div>

                        <div class="pdp-price-row">
                            <span class="pdp-price">${formatCurrency(product.price)}/kg</span>
                            <span class="pdp-stock-note">${product.stock} units available</span>
                        </div>

                        <p class="pdp-short-description">${product.shortDescription}</p>

                        <div class="pdp-purchase-card">
                            <div class="pdp-quantity-header">
                                <span>Quantity</span>
                                <span class="pdp-live-total">Total: <strong id="pdp-live-total">${formatCurrency(product.price)}</strong></span>
                            </div>
                            <div class="pdp-quantity-controls">
                                <button type="button" class="pdp-qty-btn" data-qty-action="decrease" ${product.stock === 0 ? "disabled" : ""}>-</button>
                                <input id="pdp-quantity" class="pdp-qty-input" type="number" min="1" max="${Math.max(product.stock, 1)}" value="1" ${product.stock === 0 ? "disabled" : ""}>
                                <button type="button" class="pdp-qty-btn" data-qty-action="increase" ${product.stock === 0 ? "disabled" : ""}>+</button>
                            </div>
                            <div class="pdp-action-row">
                                <button type="button" id="pdp-add-to-cart" class="btn btn-primary" ${product.stock === 0 ? "disabled" : ""}>
                                    Add To Cart
                                </button>
                                <button type="button" id="pdp-buy-now" class="btn btn-outline" ${product.stock === 0 ? "disabled" : ""}>
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="pdp-tabs-section">
            <div class="container">
                <div class="pdp-tabs">
                    <div class="pdp-tab-buttons" role="tablist" aria-label="Product information">
                        <button type="button" class="pdp-tab-btn active" data-tab-target="description">Description</button>
                        <button type="button" class="pdp-tab-btn" data-tab-target="specifications">Specifications</button>
                        <button type="button" class="pdp-tab-btn" data-tab-target="nutrition">Nutritional Information</button>
                        <button type="button" class="pdp-tab-btn" data-tab-target="shipping">Shipping & Delivery</button>
                    </div>
                    <div class="pdp-tab-content">
                        ${buildTabPanel("description", "Product Overview", descriptionContent)}
                        ${buildTabPanel("specifications", "Specifications", specificationsContent)}
                        ${buildTabPanel("nutrition", "Nutritional Information", nutritionContent)}
                        ${buildTabPanel("shipping", "Shipping & Delivery", shippingContent)}
                    </div>
                </div>
            </div>
        </section>

        <section class="pdp-feature-section">
            <div class="container">
                <div class="section-heading">
                    <h2 class="section-title">Product Features</h2>
                    <p class="section-subtitle">Built for premium quality, clean sourcing, and confident export supply.</p>
                </div>
                <div class="pdp-feature-grid">
                    ${product.features
        .map(
            (feature) => `
                                <article class="pdp-feature-card">
                                    <div class="pdp-feature-icon">
                                        <i class="fa-solid ${feature.icon}"></i>
                                    </div>
                                    <h3>${feature.label}</h3>
                                </article>
                            `
        )
        .join("")}
                </div>
            </div>
        </section>

        <section class="pdp-related-section">
            <div class="container">
                <div class="section-heading">
                    <h2 class="section-title">Related Products</h2>
                    <p class="section-subtitle">Explore more premium makhana options from our collection.</p>
                </div>
                <div class="product-grid related-product-grid">${relatedProductsMarkup}</div>
            </div>
        </section>
    `;
}

function renderNotFound(rootPath) {
    return `
        <section class="pdp-not-found">
            <div class="container">
                <div class="not-found-card">
                    <span class="pdp-badge">404</span>
                    <h1>Product Not Found</h1>
                    <p>The product you’re looking for is unavailable or the link is incorrect.</p>
                    <div class="not-found-actions">
                        <a href="${getHomeRoute(rootPath)}#products" class="btn btn-primary">Back To Products</a>
                        <a href="${getHomeRoute(rootPath)}" class="btn btn-outline">Go Home</a>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function initGallery() {
    const mainImage = document.getElementById("pdp-main-image");
    if (!mainImage) return;

    document.querySelectorAll("[data-gallery-image]").forEach((thumbnail) => {
        thumbnail.addEventListener("click", () => {
            const nextImage = thumbnail.getAttribute("data-gallery-image");
            if (!nextImage) return;

            mainImage.setAttribute("src", nextImage);
            document.querySelectorAll("[data-gallery-image]").forEach((item) => item.classList.remove("active"));
            thumbnail.classList.add("active");
        });
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll(".pdp-tab-btn");
    const tabPanels = document.querySelectorAll(".pdp-tab-panel");
    if (!tabButtons.length || !tabPanels.length) return;

    const activateTab = (tabId) => {
        tabButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.tabTarget === tabId);
        });

        tabPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.tabPanel === tabId);
        });
    };

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
    });

    activateTab("description");
}

function initQuantityControls(product, rootPath) {
    const quantityInput = document.getElementById("pdp-quantity");
    const totalElement = document.getElementById("pdp-live-total");
    const addToCartButton = document.getElementById("pdp-add-to-cart");
    const buyNowButton = document.getElementById("pdp-buy-now");

    if (!quantityInput || !totalElement || !addToCartButton || !buyNowButton) return;

    const clampQuantity = (value) => {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 1 : parsed;
        return Math.min(Math.max(safeValue, 1), Math.max(product.stock, 1));
    };

    const syncTotal = () => {
        const currentQuantity = clampQuantity(quantityInput.value);
        quantityInput.value = String(currentQuantity);
        totalElement.textContent = formatCurrency(product.price * currentQuantity);
        return currentQuantity;
    };

    document.querySelectorAll("[data-qty-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const currentQuantity = clampQuantity(quantityInput.value);
            const nextQuantity =
                button.dataset.qtyAction === "increase" ? currentQuantity + 1 : currentQuantity - 1;
            quantityInput.value = String(clampQuantity(nextQuantity));
            syncTotal();
        });
    });

    quantityInput.addEventListener("input", syncTotal);

    addToCartButton.addEventListener("click", () => {
        const quantity = syncTotal();
        const { appliedQuantity } = addToCart(product, quantity);
        showToast(
            appliedQuantity > 0
                ? "Product added to cart successfully"
                : "Selected quantity already matches available stock"
        );
    });

    buyNowButton.addEventListener("click", () => {
        const quantity = syncTotal();
        addToCart(product, quantity);
        window.location.href = getCartRoute(rootPath);
    });

    syncTotal();
}

function initRelatedProductActions() {
    initHomePage();
}

function updateSeo(product) {
    document.title = `${product.name} | Bihar Makhana Export`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute(
        "content",
        `${product.shortDescription} Premium quality makhana sourced directly from Bihar wetlands.`
    );
}

document.addEventListener("DOMContentLoaded", () => {
    initSharedSite();

    const rootPath = getRootPath();
    const productRoot = document.getElementById("product-page-root");
    if (!productRoot) return;

    productRoot.innerHTML = buildSkeleton();

    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const productId = document.body.dataset.productId || pathSegments[pathSegments.length - 1];
    const product = getProductById(productId);

    window.setTimeout(() => {
        if (!product) {
            productRoot.innerHTML = renderNotFound(rootPath);
            return;
        }

        updateSeo(product);
        productRoot.innerHTML = buildProductPage(product, rootPath);
        initGallery();
        initTabs();
        initQuantityControls(product, rootPath);
        initRelatedProductActions();

        const badge = document.querySelector(".cart-count");
        if (badge) {
            badge.textContent = String(getCartCount());
        }
    }, 150);
});
