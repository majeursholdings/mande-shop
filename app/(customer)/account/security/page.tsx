import type { Metadata } from "next";
import SecuritySection from "@/components/account/securitySection";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
    return <SecuritySection />;
}
