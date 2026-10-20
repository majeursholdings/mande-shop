import type { Metadata } from "next";
import ProfileSection from "@/components/account/profileSection";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
    return <ProfileSection />;
}
