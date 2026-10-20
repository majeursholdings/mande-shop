import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/accountShell";
import SupportView from "@/components/support/supportView";

export const metadata: Metadata = { title: "Support" };

export default function AccountSupportPage() {
    return (
        <AccountPanel title="Help and support" description="Questions about an order, a delivery or a return? We're here to help.">
            <SupportView />
        </AccountPanel>
    );
}
