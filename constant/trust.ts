import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Headset, Lock, RotateCcw, ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// The promises the product page makes to buyers, in one place. Each must stay
// true to what MANDE actually does and to the published policies (the returns
// policy, SHOP_IMPLEMENTATION.md 6.4): change the wording here when a policy
// changes, and never promise what the shop doesn't do.
// ─────────────────────────────────────────────────────────────────────────────

export type TrustPoint = { icon: LucideIcon; title: string; text: string; href?: string };

/** The returns promise for a product that only goes back with a problem (made to order, or the seller says so). */
export const PROBLEM_ONLY_RETURNS: TrustPoint = {
    icon: RotateCcw,
    title: "Protected against problems",
    text: "This item can't be returned for a change of mind. If it's faulty, damaged or not as described, return it within 7 days of delivery and we refund you, delivery included.",
    href: "/legal",
};

export const TRUST_POINTS: TrustPoint[] = [
    {
        icon: Lock,
        title: "Secure payment",
        text: "Pay by card, bank transfer or USSD on our payment partner's secure page. Your card details never reach MANDE or the seller.",
    },
    {
        icon: ShieldCheck,
        title: "Delivery protected",
        text: "Your money is held by MANDE, not the seller. If your order doesn't arrive, you get it back.",
    },
    {
        icon: RotateCcw,
        title: "7-day returns",
        text: "Changed your mind? Return it within 7 days of delivery for store credit. Faulty, damaged or not as described? We refund you, delivery included.",
        href: "/legal",
    },
    {
        icon: BadgeCheck,
        title: "Verified sellers",
        text: "Every maker on MANDE Shop has their identity checked before they can sell.",
    },
    {
        icon: Headset,
        title: "Real help",
        text: "Questions about an order? Our team is here Monday to Saturday.",
        href: "/support",
    },
];

/** How customers can pay, as shown under "Add to cart". */
export const PAYMENT_METHODS = ["Card", "Bank transfer", "USSD"];
