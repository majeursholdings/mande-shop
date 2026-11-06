"use client";

import { createContext, use, useState, useSyncExternalStore, type ReactNode } from "react";
import { Clock, PackageCheck, PackageX } from "lucide-react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup } from "@/components/ui/radio-group";
import ProductPurchase from "@/components/cart/productPurchase";
import { formatKobo } from "@/lib/currency";
import type { ProductDetail, ProductVariant } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import ProductGallery from "./productGallery";
import TrustPanel from "./trustPanel";

// ─────────────────────────────────────────────────────────────────────────────
// The parts of the product page that follow the variant chosen: the option
// picker, the photos (the variant's first), the price, the stock, the
// returns promise and "Add to cart". A product without variants goes through
// the same parts, with nothing to choose.
//
// The chosen variant is kept in the URL (`?variant=<id>`), so a link (from
// the cart, or shared) opens on it. The page is cached and the same for
// everyone, so the server renders it with nothing chosen and the browser
// reads the URL once it's there (useSyncExternalStore), with no Suspense
// fallback in the way. Choosing updates the URL in the click handler
// (history.replaceState, which Next's router follows).
// ─────────────────────────────────────────────────────────────────────────────

/** How many are left before the page says so ("Only 3 left"). */
const LOW_STOCK = 5;
const VARIANT_PARAM = "variant";

export type VariantProduct = Pick<
    ProductDetail,
    "id" | "slug" | "title" | "priceKobo" | "priceMaxKobo" | "stock" | "leadTimeDays" | "images" | "changeOfMindReturns" | "options" | "variants"
>;

/** The value picked for each option, in the options' order (null: not picked yet). */
type Picks = (string | null)[];

type VariantState = {
    product: VariantProduct;
    picks: Picks;
    /** The variant the picks make, once every option is picked; always null without variants. */
    variant: ProductVariant | null;
    choose: (optionIndex: number, value: string) => void;
};

const VariantContext = createContext<VariantState | null>(null);

function useVariant(): VariantState {
    const state = use(VariantContext);
    if (!state) throw new Error("useVariant must be used inside <VariantProvider>");
    return state;
}

// ─── The URL ──────────────────────────────────────────────────────────────────

function subscribeToUrl(onChange: () => void) {
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
}

const getVariantParam = () => new URLSearchParams(window.location.search).get(VARIANT_PARAM);
const getServerVariantParam = () => null;

function writeVariantParam(variantId: string | null) {
    const url = new URL(window.location.href);
    if (variantId) url.searchParams.set(VARIANT_PARAM, variantId);
    else url.searchParams.delete(VARIANT_PARAM);
    window.history.replaceState(null, "", url);
}

// ─── Working out the picks ────────────────────────────────────────────────────

/** Whether a variant fits the picks so far (an option not picked yet fits anything). */
const fits = (variant: ProductVariant, picks: Picks) => variant.values.every((value, index) => picks[index] === null || picks[index] === value);

const variantFor = (variants: ProductVariant[], picks: Picks) => (picks.every((pick) => pick !== null) ? (variants.find((variant) => fits(variant, picks)) ?? null) : null);

/**
 * Picking a value that doesn't go with the other picks moves them to the
 * nearest variant that has it: the one keeping most of them, in stock first.
 * Options not picked yet stay that way.
 */
function pick(variants: ProductVariant[], picks: Picks, optionIndex: number, value: string): Picks {
    const next = picks.map((current, index) => (index === optionIndex ? value : current));
    if (variants.some((variant) => fits(variant, next))) return next;
    const score = (variant: ProductVariant) => variant.values.filter((each, index) => index !== optionIndex && each === next[index]).length * 2 + (variant.stock !== 0 ? 1 : 0);
    const nearest = variants.filter((variant) => variant.values[optionIndex] === value).sort((a, b) => score(b) - score(a))[0];
    return nearest ? next.map((current, index) => (current === null ? null : nearest.values[index])) : next;
}

/** "available", "sold_out" (every variant it makes with the other picks is), or "unavailable" (it makes none). */
function valueState(variants: ProductVariant[], picks: Picks, optionIndex: number, value: string) {
    const others = picks.map((current, index) => (index === optionIndex ? value : current));
    const matching = variants.filter((variant) => fits(variant, others));
    if (matching.length === 0) return "unavailable";
    return matching.every((variant) => variant.stock === 0) ? "sold_out" : "available";
}

export function VariantProvider({ product, children }: { product: VariantProduct; children: ReactNode }) {
    const variantParam = useSyncExternalStore(subscribeToUrl, getVariantParam, getServerVariantParam);
    // null until they pick something here: then the URL's variant, or each option with one value
    const [picked, setPicked] = useState<Picks | null>(null);
    const fromUrl = product.variants.find((variant) => variant.id === variantParam);
    const picks = picked ?? fromUrl?.values ?? product.options.map((option) => (option.values.length === 1 ? option.values[0] : null));
    const variant = product.variants.length > 0 ? variantFor(product.variants, picks) : null;

    const choose = (optionIndex: number, value: string) => {
        const next = pick(product.variants, picks, optionIndex, value);
        setPicked(next);
        writeVariantParam(variantFor(product.variants, next)?.id ?? null);
    };

    return <VariantContext value={{ product, picks, variant, choose }}>{children}</VariantContext>;
}

// ─── The parts of the page ────────────────────────────────────────────────────

/** The photos: the chosen variant's first (or, part-way through choosing, the first variant that fits), then the product's. */
export function VariantGallery() {
    const { product, picks, variant } = useVariant();
    const shown = variant ?? (picks.some((current) => current !== null) ? product.variants.find((each) => each.images.length > 0 && fits(each, picks)) : undefined);
    const images = shown?.images.length ? [...shown.images, ...product.images.filter((image) => !shown.images.some((own) => own.url === image.url))] : product.images;
    // A new set of photos opens on its first
    return <ProductGallery key={images[0]?.url ?? "none"} images={images} title={product.title} />;
}

export function VariantPrice() {
    const { product, variant } = useVariant();
    const range = !variant && product.priceMaxKobo !== null && product.priceMaxKobo > product.priceKobo;
    return (
        <p className="text-3xl font-semibold text-neutral-900">
            {range && <span className="text-lg font-normal text-muted-foreground">From </span>}
            {formatKobo(variant?.priceKobo ?? product.priceKobo)}
        </p>
    );
}

/** In stock, sold out or made to order: the chosen variant's, or (before one is chosen) only whether it's all sold out. */
export function VariantAvailability() {
    const { product, variant } = useVariant();
    if (product.variants.length > 0 && !variant) return product.stock === 0 ? <Availability stock={0} leadTimeDays={null} /> : null;
    return <Availability stock={variant ? variant.stock : product.stock} leadTimeDays={variant ? variant.leadTimeDays : product.leadTimeDays} />;
}

function Availability({ stock, leadTimeDays }: { stock: number | null; leadTimeDays: number | null }) {
    if (stock === null) {
        return (
            <p className="flex items-center gap-2 text-sm text-neutral-700">
                <Clock className="size-4 text-primary-700" aria-hidden />
                Made to order
                {leadTimeDays ? `, ready in about ${leadTimeDays} ${leadTimeDays === 1 ? "day" : "days"}` : ""}
            </p>
        );
    }
    if (stock === 0) {
        return (
            <p className="flex items-center gap-2 text-sm font-medium text-error-700">
                <PackageX className="size-4" aria-hidden />
                Sold out
            </p>
        );
    }
    return (
        <p className="flex items-center gap-2 text-sm text-neutral-700">
            <PackageCheck className="size-4 text-primary-700" aria-hidden />
            {stock <= LOW_STOCK ? `In stock, only ${stock} left` : "In stock"}
        </p>
    );
}

/** A row of values to pick from for each option. A value that doesn't go with the other picks looks faded, and picking it moves them. */
export function VariantPicker() {
    const { product, picks, choose } = useVariant();
    if (product.options.length === 0) return null;
    return (
        <div className="flex flex-col gap-4">
            {product.options.map((option, optionIndex) => {
                const labelId = `option-${optionIndex}-label`;
                return (
                    <div key={option.name} className="flex flex-col gap-2">
                        <p id={labelId} className="text-sm text-neutral-700">
                            <span className="font-medium text-neutral-900">{option.name}</span>
                            {picks[optionIndex] ? `: ${picks[optionIndex]}` : ""}
                        </p>
                        <RadioGroup
                            aria-labelledby={labelId}
                            value={picks[optionIndex] ?? null}
                            onValueChange={(value) => choose(optionIndex, String(value))}
                            className="flex flex-wrap gap-2"
                        >
                            {option.values.map((value) => {
                                const state = valueState(product.variants, picks, optionIndex, value);
                                return (
                                    <RadioPrimitive.Root
                                        key={value}
                                        value={value}
                                        className={cn(
                                            "flex min-h-10 cursor-pointer items-center rounded-button border border-border bg-white px-3.5 text-sm text-neutral-900 outline-none transition-colors duration-200 select-none hover:border-primary-300 focus-visible:ring-3 focus-visible:ring-ring/50",
                                            "data-checked:border-primary data-checked:bg-primary-50 data-checked:font-medium data-checked:ring-1 data-checked:ring-primary",
                                            state === "sold_out" && "text-muted-foreground line-through",
                                            state === "unavailable" && "border-dashed text-muted-foreground",
                                        )}
                                    >
                                        {value}
                                        {state === "sold_out" && <span className="sr-only"> (sold out)</span>}
                                        {state === "unavailable" && <span className="sr-only"> (not available with your other choices)</span>}
                                    </RadioPrimitive.Root>
                                );
                            })}
                        </RadioGroup>
                    </div>
                );
            })}
        </div>
    );
}

/** "Add to cart" for the chosen variant: closed, with a hint, until every option is picked. */
export function VariantPurchase() {
    const { product, variant } = useVariant();
    const needsChoice = product.variants.length > 0 && !variant;
    const names = product.options.map((option) => option.name.toLowerCase());
    const hint = needsChoice ? `Choose ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]} to add it to your cart.` : null;
    return (
        // A new variant starts again from a quantity of 1, within its own stock
        <ProductPurchase
            key={variant?.id ?? "product"}
            product={{ id: product.id, slug: product.slug, title: product.title, stock: variant ? variant.stock : product.stock }}
            variant={variant && { id: variant.id, label: variant.label }}
            chooseHint={hint}
        />
    );
}

/** The returns promise: the chosen variant's (made to order goes back only with a problem). */
export function VariantTrustPanel() {
    const { product, variant } = useVariant();
    return <TrustPanel changeOfMindReturns={(variant ?? product).changeOfMindReturns !== false} />;
}
