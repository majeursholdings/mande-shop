import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetailSection } from "@/components/account/ordersSection";
import { PanelSkeleton } from "@/components/account/accountShell";

export const metadata: Metadata = { title: "Your order" };

type Params = { params: Promise<{ code: string }> };

// The code is read inside <Suspense>, so the account frame shows at once
export default function OrderPage({ params }: Params) {
    return (
        <Suspense fallback={<PanelSkeleton rows={4} />}>
            <OrderDetail params={params} />
        </Suspense>
    );
}

async function OrderDetail({ params }: Params) {
    const { code } = await params;
    return <OrderDetailSection code={decodeURIComponent(code).toUpperCase()} />;
}
