import type { Metadata } from "next";
import AddressesSection from "@/components/account/addressesSection";

export const metadata: Metadata = { title: "Your addresses" };

export default function AddressesPage() {
    return <AddressesSection />;
}
