import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/accountShell";
import { LegalList, LegalListSkeleton } from "@/components/legal/legalViews";
import { getLegalDocuments } from "@/lib/cms/legal";

export const metadata: Metadata = { title: "Legal" };

export default function AccountLegalPage() {
    return (
        <AccountPanel title="Terms and policies" description="The terms you shop under, our returns policy, and how we look after your data.">
            <Suspense fallback={<LegalListSkeleton />}>
                <Documents />
            </Suspense>
        </AccountPanel>
    );
}

async function Documents() {
    return <LegalList documents={await getLegalDocuments().catch(() => null)} />;
}
