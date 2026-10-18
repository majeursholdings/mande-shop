// Mirrors mande-backend/src/constants/shop.ts. Change both together
// (see SHOP_IMPLEMENTATION.md 5.1). Products store the slugs, so names can be
// renamed freely, but removing or moving a slug needs a product migration.

import type { LucideIcon } from "lucide-react";
import { Armchair, Baby, BedDouble, Briefcase, CookingPot, Flower2, Frame, Package, UtensilsCrossed } from "lucide-react";

export type ShopSubcategory = { slug: string; name: string };
export type ShopCategory = {
    slug: string;
    name: string;
    /** Shown until the category has its photo in public/categories/ */
    icon: LucideIcon;
    subcategories: ShopSubcategory[];
};

/** Draft v1 list, to be confirmed. */
export const SHOP_CATEGORIES: ShopCategory[] = [
    {
        slug: "living-room",
        name: "Living room",
        icon: Armchair,
        subcategories: [
            { slug: "sofas", name: "Sofas" },
            { slug: "sectionals", name: "Sectionals" },
            { slug: "armchairs", name: "Armchairs" },
            { slug: "coffee-tables", name: "Coffee tables" },
            { slug: "side-tables", name: "Side tables" },
            { slug: "tv-stands", name: "TV stands" },
            { slug: "shelves", name: "Shelves" },
        ],
    },
    {
        slug: "bedroom",
        name: "Bedroom",
        icon: BedDouble,
        subcategories: [
            { slug: "beds", name: "Beds" },
            { slug: "wardrobes", name: "Wardrobes" },
            { slug: "dressers", name: "Dressers" },
            { slug: "bedside-tables", name: "Bedside tables" },
            { slug: "headboards", name: "Headboards" },
        ],
    },
    {
        slug: "dining",
        name: "Dining",
        icon: UtensilsCrossed,
        subcategories: [
            { slug: "dining-sets", name: "Dining sets" },
            { slug: "dining-tables", name: "Dining tables" },
            { slug: "dining-chairs", name: "Dining chairs" },
            { slug: "sideboards", name: "Sideboards" },
        ],
    },
    {
        slug: "office",
        name: "Office",
        icon: Briefcase,
        subcategories: [
            { slug: "office-desks", name: "Office desks" },
            { slug: "office-chairs", name: "Office chairs" },
            { slug: "conference-tables", name: "Conference tables" },
            { slug: "filing-cabinets", name: "Filing cabinets" },
            { slug: "reception-desks", name: "Reception desks" },
        ],
    },
    {
        slug: "kitchen",
        name: "Kitchen",
        icon: CookingPot,
        subcategories: [
            { slug: "kitchen-cabinets", name: "Kitchen cabinets" },
            { slug: "kitchen-islands", name: "Kitchen islands" },
            { slug: "bar-stools", name: "Bar stools" },
        ],
    },
    {
        slug: "outdoor",
        name: "Outdoor",
        icon: Flower2,
        subcategories: [
            { slug: "garden-sets", name: "Garden sets" },
            { slug: "loungers", name: "Loungers" },
            { slug: "outdoor-tables", name: "Outdoor tables" },
            { slug: "outdoor-chairs", name: "Outdoor chairs" },
        ],
    },
    {
        slug: "kids",
        name: "Kids",
        icon: Baby,
        subcategories: [
            { slug: "kids-beds", name: "Kids beds" },
            { slug: "study-tables", name: "Study tables" },
            { slug: "kids-storage", name: "Kids storage" },
        ],
    },
    {
        slug: "storage",
        name: "Storage",
        icon: Package,
        subcategories: [
            { slug: "bookshelves", name: "Bookshelves" },
            { slug: "shoe-racks", name: "Shoe racks" },
            { slug: "cabinets", name: "Cabinets" },
            { slug: "chests", name: "Chests" },
        ],
    },
    {
        slug: "decor",
        name: "Décor",
        icon: Frame,
        subcategories: [
            { slug: "mirrors", name: "Mirrors" },
            { slug: "wall-shelves", name: "Wall shelves" },
            { slug: "room-dividers", name: "Room dividers" },
        ],
    },
];

export function getShopCategory(slug: string): ShopCategory | undefined {
    return SHOP_CATEGORIES.find((category) => category.slug === slug);
}

/** A category and one of its subcategories, or undefined when either doesn't exist (or they don't go together). */
export function getShopSubcategory(categorySlug: string, subcategorySlug: string) {
    const category = getShopCategory(categorySlug);
    const subcategory = category?.subcategories.find((sub) => sub.slug === subcategorySlug);
    return category && subcategory ? { category, subcategory } : undefined;
}

export const categoryHref = (category: string) => `/c/${category}`;
export const subcategoryHref = (category: string, subcategory: string) => `/c/${category}/${subcategory}`;
export const productHref = (slug: string) => `/p/${slug}`;
export const sellerHref = (slug: string) => `/s/${slug}`;

/** Matches the API's page size cap (SHOP_IMPLEMENTATION.md 5.6). */
export const SHOP_PAGE_SIZE = 24;
export const SHOP_MAX_PAGE = 100;

export const PRODUCT_SORTS = [
    { value: "recommended", label: "Recommended" },
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "top-rated", label: "Top rated" },
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number]["value"];

export function parseProductSort(value: unknown): ProductSort {
    return PRODUCT_SORTS.some((sort) => sort.value === value) ? (value as ProductSort) : "recommended";
}

/** A `?page=` value as a page number from 1 to SHOP_MAX_PAGE; anything else is page 1. */
export function parsePage(value: unknown): number {
    const page = Number(Array.isArray(value) ? value[0] : value);
    return Number.isInteger(page) && page >= 1 ? Math.min(page, SHOP_MAX_PAGE) : 1;
}
