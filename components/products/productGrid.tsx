import { Skeleton } from "@/components/ui/skeleton";
import { SHOP_PAGE_SIZE } from "@/constant/shop";
import type { ProductCardData } from "@/lib/types/shop";
import ProductCard from "./productCard";

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

export default function ProductGrid({ products }: { products: ProductCardData[] }) {
    return (
        <ul className={GRID_CLASS}>
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product} />
                </li>
            ))}
        </ul>
    );
}

/** A page of product cards while they load, shaped like ProductCard. */
export function ProductGridSkeleton({ count = SHOP_PAGE_SIZE }: { count?: number }) {
    return (
        <ul className={GRID_CLASS} aria-hidden>
            {Array.from({ length: count }, (_, index) => (
                <li key={index} className="overflow-hidden rounded-xl border border-border bg-white">
                    <Skeleton className="aspect-square rounded-none" />
                    <div className="flex flex-col gap-2 p-3">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="mt-2 h-5 w-24" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
