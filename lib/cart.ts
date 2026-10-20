import { NIGERIAN_STATES, type NigerianState } from "@/constant/shop";

// ─────────────────────────────────────────────────────────────────────────────
// The cart, kept in this browser's localStorage (SHOP_IMPLEMENTATION.md 10.2):
// which products, how many, and whether they'll collect. Prices, stock and
// delivery are never kept here: the API prices the cart each time it's shown
// (POST /shop/cart/quote), and again at checkout. Components read it with
// useSyncExternalStore (hooks/useCart.ts), and only change it in event
// handlers. Other tabs follow along through the storage event.
//
// The state to deliver to is kept the same way, so the cart, product pages
// and checkout all price delivery for the same place.
// ─────────────────────────────────────────────────────────────────────────────

export type CartItem = { productId: string; slug: string; quantity: number; pickup?: boolean };

const CART_KEY = "mande_shop_cart_v1";
const STATE_KEY = "mande_shop_delivery_state";
/** Mirrors mande-backend's CART_MAX_LINES and CART_MAX_QUANTITY. */
export const CART_MAX_LINES = 50;
export const CART_MAX_QUANTITY = 1000;

const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
        if (event.key === CART_KEY || event.key === STATE_KEY) notify();
    });
}

export function subscribeToCart(onChange: () => void): () => void {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
}

function readStorage(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string | null) {
    try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
    } catch {
        // Private browsing or storage turned off: the cart lasts only as long as this page
    }
    notify();
}

const isCartItem = (value: unknown): value is CartItem =>
    !!value &&
    typeof value === "object" &&
    typeof (value as CartItem).productId === "string" &&
    /^[a-f\d]{24}$/i.test((value as CartItem).productId) &&
    typeof (value as CartItem).slug === "string" &&
    Number.isInteger((value as CartItem).quantity) &&
    (value as CartItem).quantity >= 1;

// The snapshot must be the same array until the cart changes, so it's kept by its stored text
let lastRaw: string | null = null;
let lastItems: CartItem[] = EMPTY;

export function getCartSnapshot(): CartItem[] {
    const raw = readStorage(CART_KEY);
    if (raw === lastRaw) return lastItems;
    lastRaw = raw;
    try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        lastItems = Array.isArray(parsed) ? parsed.filter(isCartItem).slice(0, CART_MAX_LINES) : EMPTY;
    } catch {
        lastItems = EMPTY;
    }
    return lastItems;
}

/** The server has no cart: it renders an empty one, and the browser fills it in. */
export const getServerCartSnapshot = (): CartItem[] => EMPTY;

function saveCart(items: CartItem[]) {
    writeStorage(CART_KEY, items.length ? JSON.stringify(items) : null);
}

const clamp = (quantity: number, max: number | null) => Math.max(1, Math.min(quantity, max ?? CART_MAX_QUANTITY, CART_MAX_QUANTITY));

/** Adds `quantity` (on top of any already in the cart), up to `max` (the stock), or false when the cart is full. */
export function addToCart(product: { productId: string; slug: string }, quantity: number, max: number | null = null): boolean {
    const items = getCartSnapshot();
    const existing = items.find((item) => item.productId === product.productId);
    if (!existing && items.length >= CART_MAX_LINES) return false;
    saveCart(
        existing
            ? items.map((item) => (item.productId === product.productId ? { ...item, quantity: clamp(item.quantity + quantity, max) } : item))
            : [...items, { productId: product.productId, slug: product.slug, quantity: clamp(quantity, max) }],
    );
    return true;
}

export function setCartQuantity(productId: string, quantity: number, max: number | null = null) {
    saveCart(getCartSnapshot().map((item) => (item.productId === productId ? { ...item, quantity: clamp(quantity, max) } : item)));
}

export function setCartPickup(productId: string, pickup: boolean) {
    saveCart(getCartSnapshot().map((item) => (item.productId === productId ? { ...item, pickup } : item)));
}

export function removeFromCart(...productIds: string[]) {
    saveCart(getCartSnapshot().filter((item) => !productIds.includes(item.productId)));
}

export function clearCart() {
    saveCart([]);
}

// ─── The state to deliver to ──────────────────────────────────────────────────

export function getDeliveryStateSnapshot(): NigerianState | null {
    const raw = readStorage(STATE_KEY);
    return raw && (NIGERIAN_STATES as readonly string[]).includes(raw) ? (raw as NigerianState) : null;
}

export const getServerDeliveryStateSnapshot = (): NigerianState | null => null;

export function setDeliveryState(state: NigerianState) {
    writeStorage(STATE_KEY, state);
}
