import Image from "next/image";
import Link from "next/link";
import { ImageOff, Star } from "lucide-react";
import { formatKobo } from "@/lib/currency";
import type { ProductCardData } from "@/lib/types/shop";

export default function ProductCard({ product }: { product: ProductCardData }) {
    const soldOut = product.stock === 0;
    const madeToOrder = product.stock === null;

    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow duration-300 hover:shadow-md">
            <div className="relative aspect-square bg-mist-100">
                {product.image ? (
                    <Image
                        src={product.image.url}
                        alt={product.image.alt || product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-mist-400">
                        <ImageOff className="size-8" aria-hidden />
                    </div>
                )}
                {(soldOut || madeToOrder) && (
                    <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {soldOut ? "Sold out" : "Made to order"}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
                    {/* The whole card is the link (the ::after covers it) */}
                    <Link
                        href={`/p/${product.slug}`}
                        className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                    >
                        {product.title}
                    </Link>
                </h3>
                <p className="truncate text-xs text-muted-foreground">{product.seller.name}</p>

                {product.rating.count > 0 && (
                    <p className="flex items-center gap-1 text-xs text-neutral-700">
                        <Star className="size-3.5 fill-warning-400 text-warning-400" aria-hidden />
                        <span>
                            {product.rating.average.toFixed(1)}
                            <span className="sr-only"> out of 5</span>
                        </span>
                        <span className="text-muted-foreground">
                            ({product.rating.count} {product.rating.count === 1 ? "review" : "reviews"})
                        </span>
                    </p>
                )}

                <p className="mt-auto pt-2 text-base font-semibold text-neutral-900">{formatKobo(product.priceKobo)}</p>
            </div>
        </article>
    );
}
