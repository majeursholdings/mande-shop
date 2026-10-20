import type { Metadata } from "next";
import SupportView from "@/components/support/supportView";

export const metadata: Metadata = { title: "Help and support" };

export default function SupportPage() {
    return (
        <main className="flex-1 bg-mist-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto flex max-w-3xl flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-mist-950">Help and support</h1>
                    <p className="text-sm text-mist-500">Questions about an order, a delivery or a return? We&apos;re here to help.</p>
                </div>
                <SupportView />
            </div>
        </main>
    );
}
