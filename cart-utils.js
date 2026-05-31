import { getProductById } from "./products.js";

const CART_STORAGE_KEY = "biharMakhanaCart";

function sanitizeQuantity(quantity, maxStock = Number.MAX_SAFE_INTEGER) {
    const parsedQuantity = Number.parseInt(quantity, 10);
    const safeQuantity = Number.isNaN(parsedQuantity) ? 1 : parsedQuantity;
    return Math.min(Math.max(safeQuantity, 1), maxStock);
}

function normalizeCartItem(item) {
    if (!item) return null;

    const product = getProductById(item.id);
    const productId = product?.id || String(item.id || "");

    if (!productId) return null;

    const stock = product?.stock ?? Number.MAX_SAFE_INTEGER;
    const quantity = sanitizeQuantity(item.quantity, stock);

    return {
        id: productId,
        name: item.name || product?.name || "",
        price: Number(item.price ?? product?.price ?? 0),
        image: item.image || product?.image || "",
        quantity
    };
}

function emitCartUpdate(cart) {
    window.dispatchEvent(
        new CustomEvent("cart:updated", {
            detail: {
                cart,
                count: getCartCount(cart),
                total: getCartTotal(cart)
            }
        })
    );
}

export function getCart() {
    try {
        const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        const normalizedCart = storedCart
            .map(normalizeCartItem)
            .filter((item) => item && item.name && item.price >= 0);

        if (JSON.stringify(storedCart) !== JSON.stringify(normalizedCart)) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedCart));
        }

        return normalizedCart;
    } catch (error) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
        return [];
    }
}

export function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    emitCartUpdate(cart);
}

export function getCartCount(cart = getCart()) {
    return cart.reduce((total, item) => total + sanitizeQuantity(item.quantity), 0);
}

export function getCartTotal(cart = getCart()) {
    return cart.reduce((total, item) => total + Number(item.price) * sanitizeQuantity(item.quantity), 0);
}

export function isProductInCart(productId, cart = getCart()) {
    const normalizedId = getProductById(productId)?.id || String(productId);
    return cart.some((item) => item.id === normalizedId);
}

export function addToCart(product, quantity = 1) {
    const cart = getCart();
    const normalizedProduct = getProductById(product.id) || product;
    const safeQuantity = sanitizeQuantity(quantity, normalizedProduct.stock ?? Number.MAX_SAFE_INTEGER);
    const existingItem = cart.find((item) => item.id === normalizedProduct.id);

    let appliedQuantity = safeQuantity;

    if (existingItem) {
        const nextQuantity = sanitizeQuantity(
            existingItem.quantity + safeQuantity,
            normalizedProduct.stock ?? Number.MAX_SAFE_INTEGER
        );

        appliedQuantity = nextQuantity - existingItem.quantity;
        existingItem.quantity = nextQuantity;
    } else {
        cart.push({
            id: normalizedProduct.id,
            name: normalizedProduct.name,
            price: normalizedProduct.price,
            image: normalizedProduct.image,
            quantity: safeQuantity
        });
    }

    saveCart(cart);

    return {
        cart,
        appliedQuantity,
        item: cart.find((item) => item.id === normalizedProduct.id)
    };
}

export function removeCartItemByIndex(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
}

export function clearCart() {
    saveCart([]);
}
