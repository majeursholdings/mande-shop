"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";

/**
 * The header's account link: the signed-in customer's initials, going to
 * their account; otherwise "Sign in". A small client part of the header, so
 * the header itself stays the same for every visitor (SHOP_IMPLEMENTATION.md 10.3).
 */
export default function AccountMenu({ className }: { className: string }) {
    const { customer } = useCurrentCustomer();
    const initials = customer?.profile ? `${customer.profile.firstName[0] ?? ""}${customer.profile.lastName[0] ?? ""}`.toUpperCase() : "";

    if (customer) {
        return (
            <Link href="/account" aria-label={`Your account (${customer.profile?.firstName ?? customer.email})`} className={className}>
                <span className="flex size-7 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-primary-950">{initials || <User className="size-4" aria-hidden />}</span>
            </Link>
        );
    }
    return (
        <Link href="/login" aria-label="Sign in" className={className}>
            <User className="size-5" aria-hidden />
        </Link>
    );
}
