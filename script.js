import { addToCart, getCartCount, getCart, isProductInCart } from "./cart-utils.js";
import { getCartRoute, getProductById, getProductRoute } from "./products.js";

export function getRootPath() {
    return document.body?.dataset.rootPath || "";
}

export function updateCartBadges() {
    const cartCount = getCartCount();

    document.querySelectorAll(".cart-count").forEach((cartBadge) => {
        cartBadge.textContent = cartCount;
    });
}

export function showToast(message) {
    let toastViewport = document.querySelector(".toast-viewport");

    if (!toastViewport) {
        toastViewport = document.createElement("div");
        toastViewport.className = "toast-viewport";
        document.body.appendChild(toastViewport);
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${message}</span>`;

    toastViewport.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    window.setTimeout(() => {
        toast.classList.remove("show");
        window.setTimeout(() => toast.remove(), 250);
    }, 2600);
}

function handleCartLinkAccessibility(rootPath) {
    const cartUrl = getCartRoute(rootPath);

    document.querySelectorAll(".cart-icon").forEach((cartLink) => {
        cartLink.setAttribute("role", "link");
        cartLink.setAttribute("tabindex", "0");

        const navigateToCart = () => {
            window.location.href = cartUrl;
        };

        cartLink.addEventListener("click", navigateToCart);
        cartLink.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigateToCart();
            }
        });
    });
}

function initializeMobileNav() {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (!hamburger || !navLinks) return;

    const closeMenu = () => {
        navLinks.classList.remove("active");
        hamburger.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    };

    const toggleMenu = () => {
        const willOpen = !navLinks.classList.contains("active");
        navLinks.classList.toggle("active", willOpen);
        hamburger.classList.toggle("active", willOpen);
        hamburger.setAttribute("aria-expanded", String(willOpen));
        document.body.classList.toggle("menu-open", willOpen);
    };

    hamburger.setAttribute("role", "button");
    hamburger.addEventListener("click", toggleMenu);
    hamburger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu();
        }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
}

function markButtonAsAdded(button) {
    if (!button) return;

    button.innerHTML = '<i class="fa-solid fa-check"></i>';
    button.classList.add("added");

    const productCard = button.closest(".product-card");
    if (!productCard) return;

    const productImage = productCard.querySelector(".product-image");
    if (!productImage) return;

    let badge = productImage.querySelector(".added-badge");

    if (!badge) {
        badge = document.createElement("span");
        badge.className = "added-badge";
        badge.innerHTML = '<i class="fa-solid fa-check"></i> Added';
        productImage.appendChild(badge);
        requestAnimationFrame(() => badge.classList.add("show"));
    } else {
        badge.classList.add("show");
    }
}

function enhanceProductCards() {
    const rootPath = getRootPath();
    const cartState = getCart();

    document.querySelectorAll(".product-card[data-product-id]").forEach((productCard) => {
        const productId = productCard.dataset.productId;
        const product = getProductById(productId);
        if (!product) return;

        const detailsUrl = getProductRoute(product.id, rootPath);
        const addButton = productCard.querySelector(".add-cart-btn");
        const viewButton = productCard.querySelector(".view-btn");

        if (viewButton) {
            viewButton.setAttribute("href", detailsUrl);
            viewButton.addEventListener("click", (event) => event.stopPropagation());
        }

        productCard.setAttribute("role", "link");
        productCard.setAttribute("tabindex", "0");

        const navigateToDetails = (event) => {
            if (event.target.closest(".add-cart-btn") || event.target.closest(".view-btn")) {
                return;
            }

            window.location.href = detailsUrl;
        };

        productCard.addEventListener("click", navigateToDetails);
        productCard.addEventListener("keydown", (event) => {
            if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".add-cart-btn")) {
                event.preventDefault();
                window.location.href = detailsUrl;
            }
        });

        if (addButton) {
            if (cartState.some((item) => item.id === product.id)) {
                markButtonAsAdded(addButton);
            }

            addButton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                const { appliedQuantity } = addToCart(product, 1);

                if (appliedQuantity > 0) {
                    const cartCountElement = document.querySelector(".cart-count");
                    if (cartCountElement) {
                        cartCountElement.classList.add("bump");
                        window.setTimeout(() => cartCountElement.classList.remove("bump"), 300);
                    }
                }

                markButtonAsAdded(addButton);
                showToast(appliedQuantity > 0 ? "Product added to cart successfully" : "Maximum stock already in cart");
            });
        }
    });
}

export function initSharedSite() {
    const rootPath = getRootPath();
    handleCartLinkAccessibility(rootPath);
    initializeMobileNav();
    updateCartBadges();

    window.addEventListener("cart:updated", updateCartBadges);
}

export function initHomePage() {
    enhanceProductCards();
}

export function createRelatedProductCard(product, rootPath) {
    const detailsUrl = getProductRoute(product.id, rootPath);
    const isAdded = isProductInCart(product.id);

    return `
        <article class="product-card related-product-card" data-product-id="${product.id}">
            <div class="product-image">
                <span class="tag">${product.badge}</span>
                <img src="${rootPath}${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.shortDescription}</p>
                <div class="product-footer">
                    <span class="price">₹${product.price}/kg</span>
                    <div class="product-actions">
                        <button class="add-cart-btn${isAdded ? " added" : ""}" type="button" title="Add to Cart">
                            <i class="fa-solid ${isAdded ? "fa-check" : "fa-cart-shopping"}"></i>
                        </button>
                        <a href="${detailsUrl}" class="view-btn">View Details <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        </article>
    `;
}
