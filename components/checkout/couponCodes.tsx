"use client";

import { useState, type FormEvent } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKobo } from "@/lib/currency";
import type { CouponResult } from "@/lib/types/shop";

// ─────────────────────────────────────────────────────────────────────────────
// CouponCodes: the checkout's coupon field (SHOP_IMPLEMENTATION.md 5.8). A
// code is added to the list and the cart priced again with it; each shows
// what it took off (from which seller's items), or why it can't be used, and
// can be removed. One code per seller: a seller's code covers only their
// products. Only codes that apply are sent with the order.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CODES = 5;

export default function CouponCodes({
    codes,
    results,
    sellerByCode,
    onChange,
}: {
    codes: string[];
    /** What the quote said about each code, once priced. */
    results: CouponResult[];
    /** The seller each applied code took money off, by code. */
    sellerByCode: Map<string, string>;
    onChange: (codes: string[]) => void;
}) {
    const [draft, setDraft] = useState("");

    const add = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const code = draft.trim().toUpperCase();
            if (!code) return;
            if (codes.includes(code)) {
                toast.info(`${code} is already added.`);
                return;
            }
            if (codes.length >= MAX_CODES) {
                toast.error(`You can add up to ${MAX_CODES} codes, one for each seller.`);
                return;
            }
            onChange([...codes, code]);
            setDraft("");
        } catch {
            toast.error("Couldn't add that code. Please try again.");
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={add} className="flex gap-2">
                <label htmlFor="coupon-code" className="sr-only">
                    Coupon code
                </label>
                <Input
                    id="coupon-code"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Coupon code"
                    maxLength={20}
                    autoComplete="off"
                    className="h-10 uppercase"
                />
                <Button type="submit" variant="outline" className="h-10" disabled={!draft.trim()}>
                    Apply
                </Button>
            </form>
            {codes.length > 0 && (
                <ul className="flex flex-col gap-1.5 text-sm">
                    {codes.map((code) => {
                        const result = results.find((entry) => entry.code === code);
                        return (
                            <li key={code} className="flex items-start gap-2">
                                <Tag className="mt-0.5 size-4 shrink-0 text-mist-500" aria-hidden />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="font-medium text-mist-950">{code}</span>
                                    {result?.status === "applied" && (
                                        <span className="text-primary-800">
                                            {formatKobo(result.discountKobo)} off {sellerByCode.get(code) ? `${sellerByCode.get(code)}'s items` : "your order"}
                                        </span>
                                    )}
                                    {result?.status === "rejected" && <span className="text-error-700">{result.message}</span>}
                                </span>
                                <button type="button" aria-label={`Remove ${code}`} onClick={() => onChange(codes.filter((each) => each !== code))} className="cursor-pointer text-mist-500 hover:text-mist-950">
                                    <X className="size-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
