import { Suspense } from "react";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/layout/breadcrumbs";
import { LegalList, LegalListSkeleton } from "@/components/legal/legalViews";
import { getLegalDocuments } from "@/lib/cms/legal";

export const metadata: Metadata = {
    title: "Terms and policies",
    description: "MANDE Shop's terms, returns policy and privacy policy.",
    alternates: { canonical: "/legal" },
};

export default function LegalPage() {
    return (
        <main className="flex-1 bg-mist-50 px-2.5 py-8 sm:px-6 md:py-12 lg:px-8">
            <div className="container mx-auto flex max-w-3xl flex-col gap-6">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Legal" }]} />
                <h1 className="text-3xl tracking-tight text-neutral-900 md:text-4xl">Terms and policies</h1>
                <Suspense fallback={<LegalListSkeleton />}>
                    <Documents />
                </Suspense>
            </div>
        </main>
    );
}

async function Documents() {
    return <LegalList documents={await getLegalDocuments().catch(() => null)} />;
}
