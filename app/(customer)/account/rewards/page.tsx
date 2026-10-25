import type { Metadata } from "next";
import { Suspense } from "react";
import { PanelSkeleton } from "@/components/account/accountShell";
import RewardsSection from "@/components/account/rewardsSection";

export const metadata: Metadata = { title: "Rewards" };

export default function AccountRewardsPage() {
    // The page is in the URL
    return (
        <Suspense fallback={<PanelSkeleton rows={4} />}>
            <RewardsSection />
        </Suspense>
    );
}
