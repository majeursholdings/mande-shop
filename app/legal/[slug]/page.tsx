import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentSkeleton, LegalDocumentView } from "@/components/legal/legalViews";
import { legalHref } from "@/constant/legal";
import { getLegalDocument, getLegalDocuments } from "@/lib/cms/legal";

// The published policies are built ahead; one published later renders on its first visit
export async function generateStaticParams() {
    const documents = await getLegalDocuments().catch(() => []);
    return documents.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
    const document = await getLegalDocument((await params).slug).catch(() => null);
    if (!document) return { robots: { index: false } };
    return { title: document.title, description: document.summary, alternates: { canonical: legalHref(document.slug) } };
}

export default function LegalDocumentPage({ params }: PageProps<"/legal/[slug]">) {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <Suspense fallback={<LegalDocumentSkeleton />}>
                <DocumentContent params={params} />
            </Suspense>
        </main>
    );
}

async function DocumentContent({ params }: Pick<PageProps<"/legal/[slug]">, "params">) {
    let document;
    try {
        document = await getLegalDocument((await params).slug);
    } catch {
        return (
            <p role="alert" className="container mx-auto rounded-xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">
                We couldn&apos;t load this policy. Please refresh the page.
            </p>
        );
    }
    if (!document) notFound();
    return <LegalDocumentView document={document} />;
}
