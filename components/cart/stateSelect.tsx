"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIGERIAN_STATES, type NigerianState } from "@/constant/shop";
import { setDeliveryState } from "@/lib/cart";
import { cn } from "@/lib/utils";

const STATE_ITEMS = NIGERIAN_STATES.map((state) => ({ value: state, label: state === "FCT" ? "FCT (Abuja)" : state }));

/** Which state to deliver to: kept in this browser, so the cart, product pages and checkout agree. */
export default function StateSelect({ value, className }: { value: NigerianState | null; className?: string }) {
    return (
        <Select<NigerianState, false> items={STATE_ITEMS} value={value} onValueChange={(next) => next && setDeliveryState(next)}>
            <SelectTrigger aria-label="State to deliver to" className={cn("h-10 w-full rounded-button bg-white px-3 text-sm", className)}>
                <SelectValue placeholder="Choose your state" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
                {STATE_ITEMS.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="text-sm">
                        {state.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
