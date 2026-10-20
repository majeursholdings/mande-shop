import { ProductGridSkeleton } from "@/components/products/productGrid";
import ProductCard from "@/components/products/productCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getRelatedProducts } from "@/lib/catalogue/products";
import type { ProductCardData } from "@/lib/types/shop";

/** A row of product cards that scrolls sideways on small screens. */
function Row({ title, subtitle, products }: { title: string; subtitle?: string; products: ProductCardData[] }) {
    if (products.length === 0) return null;
    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-xl text-neutral-900">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <ul className="-mx-2.5 flex snap-x gap-3 overflow-x-auto px-2.5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {products.slice(0, 8).map((product) => (
                    <li key={product.id} className="w-44 shrink-0 snap-start sm:w-auto">
                        <ProductCard product={product} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

/**
 * Under the product: what goes well with it (cross-sell), upgrades in the
 * same line (up-sell), more from the same seller, and similar products. A
 * row with nothing in it isn't shown.
 */
export default async function RelatedProducts({ slug, sellerName }: { slug: string; sellerName: string }) {
    const related = await getRelatedProducts(slug).catch(() => null);
    if (!related) return null;
    return (
        <div className="flex flex-col gap-10">
            <Row title="Goes well with" subtitle="Complete the room with pieces that pair with this one." products={related.goesWellWith} />
            <Row title="Upgrade your pick" subtitle="Highly rated options in the same range." products={related.upgrades} />
            <Row title={`More from ${sellerName}`} products={related.fromSeller} />
            <Row title="Similar products" products={related.similar} />
        </div>
    );
}

export function RelatedProductsSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-7 w-48" />
            <ProductGridSkeleton count={4} />
        </div>
    );
}
