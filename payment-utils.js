const CHECKOUT_CUSTOMER_STORAGE_KEY = "biharMakhanaCheckoutCustomer";

function getApiBaseUrl() {
    return (document.body.dataset.apiBaseUrl || "").replace(/\/$/, "");
}

export function getPaymentApiUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getCookie(name) {
    const cookieValue = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split("=")[1];
    return cookieValue ? decodeURIComponent(cookieValue) : "";
}

export async function ensurePaymentCsrf() {
    const existingToken = getCookie("csrftoken");
    if (existingToken) return existingToken;

    const response = await fetch(getPaymentApiUrl("/api/payment/csrf/"), {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Unable to initialize secure checkout. Please refresh and try again.");
    }

    const token = getCookie("csrftoken");
    if (!token) {
        throw new Error("CSRF token was not set by the server.");
    }

    return token;
}

export function saveCheckoutCustomer(customer) {
    sessionStorage.setItem(CHECKOUT_CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
}

export function getCheckoutCustomer() {
    try {
        return JSON.parse(sessionStorage.getItem(CHECKOUT_CUSTOMER_STORAGE_KEY)) || null;
    } catch (error) {
        sessionStorage.removeItem(CHECKOUT_CUSTOMER_STORAGE_KEY);
        return null;
    }
}

export function clearCheckoutCustomer() {
    sessionStorage.removeItem(CHECKOUT_CUSTOMER_STORAGE_KEY);
}

export function formatPaymentDate(value) {
    if (!value) return "NA";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function formatPaymentAmount(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}
