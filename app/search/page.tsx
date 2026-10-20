import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import SearchResults, { SearchResultsSkeleton, searchWords } from "@/components/search/searchResults";

// Search renders on each request (every search is different), inside
// <Suspense> so the header shows at once. Results pages aren't indexed (the
// category and product pages are), but their links are followed.

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
    const q = searchWords((await searchParams).q);
    return {
        title: q ? `Search: ${q}` : "Search",
        description: "Search furniture from MANDE and verified Nigerian manufacturers.",
        robots: { index: false, follow: true },
    };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
                <h1 className="text-3xl tracking-tight text-neutral-900 md:text-4xl">Search</h1>
                <Suspense fallback={<SearchResultsSkeleton />}>
                    <SearchResults searchParams={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}
