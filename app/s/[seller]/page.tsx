import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/catalogue/sellers";
import { sellerHref } from "@/constant/shop";
import { listCanonical } from "@/lib/seo";
import StoreView, { StoreViewSkeleton } from "@/components/sellers/storeView";

// Store slugs aren't known at build time: each page renders on request from
// the cached store read, inside <Suspense> so the header shows at once. A
// store that isn't on the shop is a 404 page streamed after the header.

export async function generateMetadata({ params, searchParams }: PageProps<"/s/[seller]">): Promise<Metadata> {
    let store;
    try {
        store = await getStore((await params).seller);
    } catch {
        return {};
    }
    if (!store) return { robots: { index: false } };
    const description = `Shop ${store.productCount} ${store.productCount === 1 ? "product" : "products"} from ${store.name}${store.state ? ` in ${store.state}` : ""} on MANDE Shop.`;
    return {
        title: store.name,
        description,
        alternates: { canonical: listCanonical(sellerHref(store.slug), await searchParams) },
        openGraph: { title: `${store.name} on MANDE Shop`, description, url: sellerHref(store.slug), images: store.avatar ? [{ url: store.avatar.url }] : undefined },
    };
}

export default function StorePage({ params, searchParams }: PageProps<"/s/[seller]">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<StoreViewSkeleton />}>
                <StoreContent params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function StoreContent({ params, searchParams }: Pick<PageProps<"/s/[seller]">, "params" | "searchParams">) {
    let store;
    try {
        store = await getStore((await params).seller);
    } catch {
        return (
            <p role="alert" className="container mx-auto rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load this seller. Please refresh the page.
            </p>
        );
    }
    if (!store) notFound();
    return <StoreView store={store} searchParams={searchParams} />;
}
