import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AllReviews, { AllReviewsSkeleton } from "@/components/product/allReviews";
import { getProduct } from "@/lib/catalogue/products";

export async function generateMetadata({ params, searchParams }: PageProps<"/p/[slug]/reviews">): Promise<Metadata> {
    const product = await getProduct((await params).slug).catch(() => null);
    if (!product) return { robots: { index: false } };
    const filtered = Object.keys(await searchParams).length > 0;
    return {
        title: `Reviews of ${product.title}`,
        description: `What buyers say about ${product.title}, sold by ${product.seller.name} on MANDE Shop.`,
        // Filtered and sorted versions point at the plain list
        alternates: { canonical: `/p/${product.slug}/reviews` },
        ...(filtered && { robots: { index: false, follow: true } }),
    };
}

export default function ProductReviewsPage({ params, searchParams }: PageProps<"/p/[slug]/reviews">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<AllReviewsSkeleton />}>
                <Content params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function Content({ params, searchParams }: Pick<PageProps<"/p/[slug]/reviews">, "params" | "searchParams">) {
    const [{ slug }, query] = await Promise.all([params, searchParams]);
    let view;
    try {
        view = await AllReviews({ slug, searchParams: query });
    } catch {
        return (
            <p role="alert" className="container mx-auto rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load the reviews. Please refresh the page.
            </p>
        );
    }
    if (!view) notFound();
    return view;
}
