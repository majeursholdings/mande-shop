import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/account/accountShell";
import ReturnsSection from "@/components/account/returnsSection";

export const metadata: Metadata = { title: "Returns & credit" };

export default function AccountReturnsPage() {
    // The tab and page are in the URL
    return (
        <Suspense fallback={<PanelSkeleton rows={3} />}>
            <ReturnsSection />
        </Suspense>
    );
}
