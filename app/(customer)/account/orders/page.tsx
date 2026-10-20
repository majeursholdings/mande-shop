import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersSection from "@/components/account/ordersSection";
import { PanelSkeleton } from "@/components/account/accountShell";

export const metadata: Metadata = { title: "Your orders" };

export default function OrdersPage() {
    return (
        <Suspense fallback={<PanelSkeleton rows={3} />}>
            <OrdersSection />
        </Suspense>
    );
}
