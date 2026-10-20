"use client";

import Link from "next/link";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, MapPin, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { authService } from "@/lib/services/authService";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The frame of every /account page: who's signed in, the account's sections,
// and signing out. Only a signed-in customer sees it; anyone else is sent to
// sign in, and brought back here afterwards. The section always renders (so
// the page prerenders, and Next can check its navigation), but loads its
// data only once the customer is known (useCurrentCustomer), showing its
// skeleton until then. Orders, reviews and notifications join the sections
// as they're built.
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/account", label: "Your details", icon: UserRound },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/security", label: "Security", icon: ShieldCheck },
];

export default function AccountShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { customer, isPending, isError } = useCurrentCustomer();

    if (!isPending && !isError && !customer) redirect(withNext(LOGIN_URL, pathname));

    const signOut = async () => {
        try {
            await authService.logout();
            queryClient.removeQueries({ queryKey: queryKeys.customer.all });
            router.replace("/");
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't sign you out. Please try again."));
        }
    };

    const name = customer?.profile ? `${customer.profile.firstName} ${customer.profile.lastName}` : null;

    return (
        <main className="flex flex-1 bg-mist-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto flex flex-col gap-6 lg:flex-row lg:gap-8">
                <aside className="flex flex-col gap-4 lg:w-64 lg:shrink-0">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-secondary-700">Your account</span>
                        {name ? <p className="truncate text-lg font-bold text-mist-950">{name}</p> : <Skeleton className="h-7 w-40" />}
                        {customer ? <p className="truncate text-sm text-mist-500">{customer.email}</p> : <Skeleton className="h-5 w-48" />}
                    </div>
                    <nav aria-label="Account sections" className="flex gap-1 overflow-x-auto lg:flex-col">
                        {SECTIONS.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex shrink-0 items-center gap-2 rounded-button px-3 py-2 text-sm font-medium transition-colors",
                                        active ? "bg-white text-secondary-700 shadow-sm" : "text-mist-700 hover:bg-white/70",
                                    )}
                                >
                                    <Icon className="size-4" aria-hidden />
                                    {label}
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={signOut}
                            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-button px-3 py-2 text-sm font-medium text-mist-700 transition-colors hover:bg-white/70"
                        >
                            <LogOut className="size-4" aria-hidden />
                            Sign out
                        </button>
                    </nav>
                </aside>
                <section className="min-w-0 flex-1">
                    {isError ? (
                        <p className="rounded-2xl border border-mist-200 bg-white p-6 text-sm text-mist-700">
                            We couldn&apos;t load your account. Check your connection and refresh the page.
                        </p>
                    ) : (
                        children
                    )}
                </section>
            </div>
        </main>
    );
}

/** Stands in for a section until the account is confirmed. */
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-6 shadow-sm" aria-hidden>
            <Skeleton className="h-7 w-48" />
            {Array.from({ length: rows }, (_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
            ))}
        </div>
    );
}

/** A white panel with a heading, for each account section. */
export function AccountPanel({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-mist-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold text-mist-950">{title}</h1>
                    {description && <p className="text-sm text-mist-500">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
