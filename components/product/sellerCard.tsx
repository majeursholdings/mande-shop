import Link from "next/link";
import { BadgeCheck, CalendarDays, MapPin, Package, Store } from "lucide-react";
import { sellerHref } from "@/constant/shop";
import type { ProductDetail } from "@/lib/types/shop";
import RatingSummary from "./ratingSummary";

const SINCE = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "Africa/Lagos" });

/** Who sells it: verified, where they are, their rating, how long and how much they sell, and their store. */
export default function SellerCard({ seller }: { seller: ProductDetail["seller"] }) {
    return (
        <section aria-labelledby="seller-heading" className="rounded-xl border border-border bg-white p-4">
            <h2 id="seller-heading" className="sr-only">
                The seller
            </h2>
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist-100 text-primary-700">
                    <Store className="size-5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={sellerHref(seller.slug)} className="truncate font-medium text-neutral-900 hover:text-primary-700">
                            {seller.name}
                        </Link>
                        {seller.kind === "mande" ? (
                            <span className="rounded-full bg-primary-950 px-2 py-0.5 text-[11px] font-medium text-white">MANDE&apos;s own stock</span>
                        ) : (
                            seller.verified && (
                                <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-800">
                                    <BadgeCheck className="size-3.5" aria-hidden />
                                    Verified maker
                                </span>
                            )
                        )}
                    </div>
                    <RatingSummary rating={seller.rating} className="text-xs" />
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {seller.state && (
                            <li className="flex items-center gap-1">
                                <MapPin className="size-3.5" aria-hidden />
                                {seller.state}
                            </li>
                        )}
                        {seller.sellingSince && (
                            <li className="flex items-center gap-1">
                                <CalendarDays className="size-3.5" aria-hidden />
                                On MANDE since {SINCE.format(new Date(seller.sellingSince))}
                            </li>
                        )}
                        <li className="flex items-center gap-1">
                            <Package className="size-3.5" aria-hidden />
                            {seller.productCount} {seller.productCount === 1 ? "product" : "products"}
                        </li>
                    </ul>
                </div>
                <Link
                    href={sellerHref(seller.slug)}
                    className="shrink-0 rounded-button border border-border px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-muted"
                >
                    Visit store
                </Link>
            </div>
        </section>
    );
}
