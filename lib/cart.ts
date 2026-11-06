import { NIGERIAN_STATES, type NigerianState } from "@/constant/shop";

// ─────────────────────────────────────────────────────────────────────────────
// The cart, kept in this browser's localStorage (SHOP_IMPLEMENTATION.md 10.2):
// which products (and which variant of each), how many, and whether they'll
// collect. A product with variants can be in it more than once, a line per
// variant, so lines are found by product and variant (`CartLineKey`). Prices, stock and
// delivery are never kept here: the API prices the cart each time it's shown
// (POST /shop/cart/quote), and again at checkout. Components read it with
// useSyncExternalStore (hooks/useCart.ts), and only change it in event
// handlers. Other tabs follow along through the storage event.
//
// The state to deliver to is kept the same way, so the cart, product pages
// and checkout all price delivery for the same place.
// ─────────────────────────────────────────────────────────────────────────────

/** `variantId`: which variant, for a product that has them (carts saved before variants have none). */
export type CartItem = { productId: string; variantId?: string; slug: string; quantity: number; pickup?: boolean };

/** What picks out one line of the cart: the product, and its variant if it has them. */
export type CartLineKey = { productId: string; variantId?: string | null };

export const isSameLine = (item: CartLineKey, key: CartLineKey) => item.productId === key.productId && (item.variantId ?? null) === (key.variantId ?? null);

/** The cart lines as the API takes them (POST /shop/cart/quote and /shop/checkout). */
export const cartItemsForApi = (items: CartItem[]) =>
    items.map(({ productId, variantId, quantity, pickup }) => ({ productId, ...(variantId && { variantId }), quantity, ...(pickup && { pickup }) }));

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

const OBJECT_ID = /^[a-f\d]{24}$/i;

const isId = (value: unknown) => typeof value === "string" && OBJECT_ID.test(value);

const isCartItem = (value: unknown): value is CartItem =>
    !!value &&
    typeof value === "object" &&
    isId((value as CartItem).productId) &&
    ((value as CartItem).variantId === undefined || isId((value as CartItem).variantId)) &&
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

/**
 * Adds `quantity` (on top of any already in the cart for the same product
 * and variant), up to `max` (the stock), or false when the cart is full. A
 * different variant of the same product is a line of its own.
 */
export function addToCart(product: { productId: string; slug: string; variantId?: string | null }, quantity: number, max: number | null = null): boolean {
    const items = getCartSnapshot();
    const existing = items.find((item) => isSameLine(item, product));
    if (!existing && items.length >= CART_MAX_LINES) return false;
    saveCart(
        existing
            ? items.map((item) => (item === existing ? { ...item, quantity: clamp(item.quantity + quantity, max) } : item))
            : [...items, { productId: product.productId, ...(product.variantId && { variantId: product.variantId }), slug: product.slug, quantity: clamp(quantity, max) }],
    );
    return true;
}

export function setCartQuantity(line: CartLineKey, quantity: number, max: number | null = null) {
    saveCart(getCartSnapshot().map((item) => (isSameLine(item, line) ? { ...item, quantity: clamp(quantity, max) } : item)));
}

export function setCartPickup(line: CartLineKey, pickup: boolean) {
    saveCart(getCartSnapshot().map((item) => (isSameLine(item, line) ? { ...item, pickup } : item)));
}

export function removeFromCart(...lines: CartLineKey[]) {
    saveCart(getCartSnapshot().filter((item) => !lines.some((line) => isSameLine(item, line))));
}

/** Takes every line of these products out of the cart, whatever their variant (a product that's gone, or one just paid for). */
export function removeProductsFromCart(...productIds: string[]) {
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
