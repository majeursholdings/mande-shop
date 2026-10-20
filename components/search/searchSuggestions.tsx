import Link from "next/link";
import { Sparkles } from "lucide-react";
import ProductGrid, { ProductGridSkeleton } from "@/components/products/productGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { getShopCategory, getShopSubcategory, subcategoryHref } from "@/constant/shop";
import { getProductsPage, searchProducts } from "@/lib/catalogue/products";
import type { ProductCardData } from "@/lib/types/shop";
import { cn } from "@/lib/utils";
import { searchHref } from "./searchLinks";

// ─────────────────────────────────────────────────────────────────────────────
// What a search that found nothing (or hasn't started) offers instead, so the
// customer always has somewhere to go:
//  • fewer words: each word of their search that does find something
//  • popular searches: the subcategories people shop most
//  • products: the shop's recommended products (in their category when they
//    searched one), from the same cached read as the home page
// Anything that can't be loaded is just left out.
// ─────────────────────────────────────────────────────────────────────────────

/** Subcategories offered as quick searches, by category and subcategory slug. */
const POPULAR: [category: string, subcategory: string][] = [
    ["living-room", "sofas"],
    ["bedroom", "beds"],
    ["dining", "dining-tables"],
    ["office", "office-chairs"],
    ["bedroom", "wardrobes"],
    ["living-room", "coffee-tables"],
    ["kitchen", "bar-stools"],
    ["storage", "bookshelves"],
];

const SUGGESTED_PRODUCTS = 8;
const CHIP_CLASS =
    "inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-sm text-neutral-700 outline-none transition-colors duration-300 hover:border-primary-300 hover:bg-primary-50 focus-visible:ring-3 focus-visible:ring-ring/50";

/** Each word of a several-word search on its own, with how many products it finds (only those that find some). */
async function wordsThatMatch(q: string, category?: string): Promise<{ word: string; total: number }[]> {
    const words = [...new Set(q.toLowerCase().split(/\s+/).filter((word) => word.length >= 2))].slice(0, 4);
    if (words.length < 2) return [];
    const results = await Promise.all(
        words.map((word) =>
            searchProducts({ q: word, page: 1, sort: "recommended", category })
                .then((page) => ({ word, total: page.total }))
                .catch(() => ({ word, total: 0 })),
        ),
    );
    return results.filter((result) => result.total > 0);
}

/** The shop's recommended products, in the category when one is given (all categories when it has none). */
async function suggestedProducts(category?: string): Promise<ProductCardData[]> {
    try {
        const inCategory = category ? (await getProductsPage({ page: 1, sort: "recommended", category })).products : [];
        const products = inCategory.length ? inCategory : (await getProductsPage({ page: 1, sort: "recommended" })).products;
        return products.slice(0, SUGGESTED_PRODUCTS);
    } catch {
        return [];
    }
}

export default async function SearchSuggestions({ q, category }: { q: string; category?: string }) {
    const [words, products] = await Promise.all([q ? wordsThatMatch(q, category) : Promise.resolve([]), suggestedProducts(category)]);
    const popular = POPULAR.flatMap(([categorySlug, subcategorySlug]) => {
        const place = getShopSubcategory(categorySlug, subcategorySlug);
        return place ? [{ href: subcategoryHref(categorySlug, subcategorySlug), name: place.subcategory.name }] : [];
    });
    const categoryName = category ? getShopCategory(category)?.name : undefined;
    const productsAreFromCategory = !!category && products.some((product) => product.category === category);

    return (
        <div className="flex flex-col gap-8">
            {words.length > 0 && (
                <section className="flex flex-col gap-3">
                    <h2 className="text-lg text-neutral-900">Try fewer words</h2>
                    <ul className="flex flex-wrap gap-2">
                        {words.map(({ word, total }) => (
                            <li key={word}>
                                <Link href={searchHref(word, { category })} className={CHIP_CLASS}>
                                    {word}
                                    <span className="ml-1.5 text-muted-foreground">({total})</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="flex flex-col gap-3">
                <h2 className="text-lg text-neutral-900">Popular searches</h2>
                <ul className="flex flex-wrap gap-2">
                    {popular.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className={CHIP_CLASS}>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            {products.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="flex items-center gap-2 text-lg text-neutral-900">
                        <Sparkles className="size-5 text-primary-700" aria-hidden />
                        {productsAreFromCategory ? `Popular in ${categoryName}` : q ? "You might like these instead" : "Popular right now"}
                    </h2>
                    <ProductGrid products={products} />
                </section>
            )}
        </div>
    );
}

export function SearchSuggestionsSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col gap-8", className)} aria-hidden>
            <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} className="h-9 w-24 rounded-full" />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-48" />
                <ProductGridSkeleton count={4} />
            </div>
        </div>
    );
}
