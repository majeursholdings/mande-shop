import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/account/accountShell";
import ReviewsSection from "@/components/account/reviewsSection";

export const metadata: Metadata = { title: "Your reviews" };

export default function AccountReviewsPage() {
    // The tab and page are in the URL
    return (
        <Suspense fallback={<PanelSkeleton rows={3} />}>
            <ReviewsSection />
        </Suspense>
    );
}
