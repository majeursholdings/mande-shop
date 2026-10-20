import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { sellerHref } from "@/constant/shop";
import type { Store } from "@/lib/types/shop";
import StoreAvatar from "./storeAvatar";

/** A store in the sellers list: who they are, where, their rating and how much they sell. The whole card links to the store. */
export default function StoreCard({ store }: { store: Store }) {
    return (
        <article className="relative flex h-full flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-shadow duration-300 hover:shadow-md">
            <div className="flex items-center gap-3">
                <StoreAvatar store={store} size="md" />
                <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 className="truncate text-base font-semibold text-neutral-900">
                        <Link href={sellerHref(store.slug)} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
                            {store.name}
                        </Link>
                    </h2>
                    {store.state && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3.5" aria-hidden />
                            {store.state}
                        </p>
                    )}
                </div>
            </div>
            {store.specialities.length > 0 && <p className="line-clamp-1 text-sm text-neutral-700">{store.specialities.join(", ")}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 text-sm">
                {store.rating.count > 0 ? (
                    <span className="flex items-center gap-1 text-neutral-700">
                        <Star className="size-3.5 fill-warning-400 text-warning-400" aria-hidden />
                        {store.rating.average.toFixed(1)}
                        <span className="sr-only"> out of 5</span>
                        <span className="text-muted-foreground">({store.rating.count})</span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">No reviews yet</span>
                )}
                <span className="text-muted-foreground">
                    {store.productCount} {store.productCount === 1 ? "product" : "products"}
                </span>
            </div>
        </article>
    );
}
