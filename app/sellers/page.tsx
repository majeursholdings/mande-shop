import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import StoresListing, { StoresListingSkeleton } from "@/components/sellers/storesListing";
import { parsePage } from "@/constant/shop";

export async function generateMetadata({ searchParams }: PageProps<"/sellers">): Promise<Metadata> {
    const params = await searchParams;
    const page = parsePage(params.page);
    const sorted = !!params.sort && params.sort !== "recommended";
    const description = "Shop from MANDE and verified Nigerian furniture manufacturers. See each seller's products, location and reviews.";
    return {
        title: "Sellers",
        description,
        // Page 2 onwards is its own page; a sorted list points at the plain one
        alternates: { canonical: page > 1 && !sorted ? `/sellers?page=${page}` : "/sellers" },
        openGraph: { title: "Sellers on MANDE Shop", description, url: "/sellers" },
    };
}

export default function SellersPage({ searchParams }: PageProps<"/sellers">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sellers" }]} />
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl tracking-tight text-neutral-900 md:text-4xl">Sellers</h1>
                    <p className="text-sm text-muted-foreground">MANDE and the verified Nigerian manufacturers selling on MANDE Shop.</p>
                </div>
                <Suspense fallback={<StoresListingSkeleton />}>
                    <StoresListing searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
