import type { Metadata } from "next";

// Signing in and the account pages belong to one customer: never indexed (SHOP_IMPLEMENTATION.md 10.3)
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CustomerLayout({ children }: LayoutProps<"/">) {
    return children;
}
