import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOP_CATEGORIES, categoryHref, getShopCategory } from "@/constant/shop";
import { listCanonical } from "@/lib/seo";
import CategoryView, { CategoryViewSkeleton } from "@/components/category/categoryView";

// Every category is known up front, so each one's page is prerendered
export function generateStaticParams() {
    return SHOP_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/c/[category]">): Promise<Metadata> {
    const category = getShopCategory((await params).category);
    if (!category) return {};
    const description = `Shop ${category.name.toLowerCase()} furniture from verified Nigerian manufacturers and MANDE: ${category.subcategories
        .map((sub) => sub.name.toLowerCase())
        .join(", ")}.`;
    return {
        title: `${category.name} furniture`,
        description,
        alternates: { canonical: listCanonical(categoryHref(category.slug), await searchParams) },
        openGraph: { title: `${category.name} furniture`, description, url: categoryHref(category.slug) },
    };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/c/[category]">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<CategoryViewSkeleton />}>
                <CategoryContent params={params} searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/c/[category]">, "params" | "searchParams">) {
    const category = getShopCategory((await params).category);
    if (!category) notFound();
    return <CategoryView category={category} searchParams={searchParams} />;
}
