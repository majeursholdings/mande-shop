"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { FormCancelButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { legalHref } from "@/constant/legal";
import { RETURN_MAX_PHOTOS, RETURN_REASONS, RETURNS_URL } from "@/constant/orders";
import { getErrorMessage } from "@/lib/api";
import { formatKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import type { CloudinaryUploadResult } from "@/lib/services/mediaService";
import { returnsService } from "@/lib/services/returnsService";
import type { CustomerOrder, OrderPart, RefundMethod, ReturnReason } from "@/lib/types/shop";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Asking to return some of a delivered part (SHOP_IMPLEMENTATION.md 6.4):
// which items and how many, why, and (for a problem) what's wrong, photos
// and where the refund goes. A change of mind comes back as store credit,
// without the delivery fee; a problem comes back with the delivery fee, to
// the card unless they'd rather have credit. Made-to-order items, and those
// the seller doesn't take back for a change of mind, can only be chosen for
// a problem. The refund shown is worked out the way the API works it out;
// the API checks everything again.
// ─────────────────────────────────────────────────────────────────────────────

type Values = { reason: ReturnReason | ""; details: string; photos: CloudinaryUploadResult[]; refundTo: RefundMethod };

const REASON_OPTIONS = RETURN_REASONS.map((reason) => ({ value: reason.value, label: reason.label }));
const REFUND_OPTIONS = [
    { value: "card", label: "Back to my card" },
    { value: "credit", label: "As store credit (to spend on MANDE Shop)" },
];

export default function ReturnDialog({ order, part, onClose }: { order: CustomerOrder; part: OrderPart; onClose: () => void }) {
    const queryClient = useQueryClient();
    const lines = part.lines.filter((line) => line.status !== "cancelled" && line.returnableQuantity > 0);
    // How many of each they're sending back (0: not this one)
    const [quantities, setQuantities] = useState<Record<string, number>>(() => (lines.length === 1 ? { [lines[0]!.id]: lines[0]!.returnableQuantity } : {}));
    const [busy, setBusy] = useState(false);
    const methods = useForm<Values>({ mode: "onTouched", defaultValues: { reason: "", details: "", photos: [], refundTo: "card" } });
    const reason = useWatch({ control: methods.control, name: "reason" });
    const refundTo = useWatch({ control: methods.control, name: "refundTo" });
    const problem = !!reason && reason !== "changed_mind";

    // A change of mind can't include items that only go back with a problem
    const allowed = (line: (typeof lines)[number]) => reason !== "changed_mind" || line.changeOfMindReturns;
    const chosen = lines.filter((line) => allowed(line) && (quantities[line.id] ?? 0) > 0);
    const refundKobo = chosen.reduce((sum, line) => {
        const quantity = quantities[line.id] ?? 0;
        return sum + line.unitPriceKobo * quantity + (problem ? Math.floor((line.deliveryFeeKobo * quantity) / line.quantity) : 0);
    }, 0);

    const fields: FormFieldConfig[] = [
        { name: "reason", type: "radio", label: "Why are you returning it?", options: REASON_OPTIONS, validation: { required: "Choose why you're returning it" } },
        ...(problem
            ? ([
                  {
                      name: "details",
                      type: "textarea",
                      label: "What's wrong?",
                      placeholder: "Tell the seller what happened, e.g. which part is damaged.",
                      rows: 3,
                      maxLength: 1000,
                      validation: { required: "Tell us what's wrong", minLength: { value: 10, message: "At least 10 characters" } },
                  },
                  {
                      name: "photos",
                      type: "image",
                      label: "Photos of the problem",
                      description: `Up to ${RETURN_MAX_PHOTOS} photos. Only the seller and MANDE see them.`,
                      multiple: true,
                      maxFiles: RETURN_MAX_PHOTOS,
                      maxSizeMB: 8,
                      uploadPurpose: "return-photo",
                      validation: { validate: (value: unknown) => (Array.isArray(value) && value.length > 0) || "Add at least one photo" },
                  },
                  { name: "refundTo", type: "radio", label: "Where should the refund go?", options: REFUND_OPTIONS },
              ] satisfies FormFieldConfig[])
            : []),
    ];

    const submit = async (values: Values) => {
        if (!values.reason) return;
        if (chosen.length === 0) {
            toast.error("Choose what you're returning.");
            return;
        }
        setBusy(true);
        try {
            const created = await returnsService.request({
                orderCode: order.code,
                partId: part.id,
                lines: chosen.map((line) => ({ lineId: line.id, quantity: quantities[line.id]! })),
                reason: values.reason,
                ...(problem && { details: values.details.trim(), refundTo: values.refundTo }),
                photos: problem ? values.photos.map((photo) => photo.publicId) : [],
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.order(order.code) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.customer.returnsAll() });
            toast.success(`Return ${created.code} requested. ${part.seller.name} will reply within 2 working days.`);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't send your return request. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Return items from {part.seller.name}</DialogTitle>
                    <DialogDescription>
                        You pay to send it back. Read the{" "}
                        <Link href={legalHref("shop-returns-policy")} className="font-medium text-secondary-700 underline" target="_blank">
                            returns policy
                        </Link>
                        .
                    </DialogDescription>
                </div>

                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-sm font-medium text-mist-950">What are you returning?</legend>
                    {lines.map((line) => {
                        const blocked = !allowed(line);
                        const quantity = quantities[line.id] ?? 0;
                        return (
                            <div key={line.id} className={cn("flex items-center gap-3 rounded-xl border p-3", quantity > 0 && !blocked ? "border-secondary-700 bg-secondary-50/40" : "border-mist-200", blocked && "opacity-60")}>
                                <input
                                    type="checkbox"
                                    aria-label={`Return ${line.title}`}
                                    checked={quantity > 0 && !blocked}
                                    disabled={blocked}
                                    onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.checked ? line.returnableQuantity : 0 }))}
                                    className="size-4 accent-secondary-700"
                                />
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                                    {line.image ? (
                                        <Image src={line.image.url} alt="" fill sizes="48px" className="object-cover" />
                                    ) : (
                                        <span className="flex h-full items-center justify-center text-mist-400">
                                            <ImageOff className="size-4" aria-hidden />
                                        </span>
                                    )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col text-sm">
                                    <span className="line-clamp-1 font-medium text-mist-950">{line.title}</span>
                                    <span className="text-mist-500">{formatKobo(line.unitPriceKobo)} each</span>
                                    {!line.changeOfMindReturns && <span className="text-xs text-warning-800">Returns only if there&apos;s a problem with it</span>}
                                </div>
                                {line.returnableQuantity > 1 && quantity > 0 && !blocked && (
                                    <select
                                        aria-label={`How many ${line.title}`}
                                        value={quantity}
                                        onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: Number(event.target.value) }))}
                                        className="h-9 rounded-button border border-input bg-white px-2 text-sm"
                                    >
                                        {Array.from({ length: line.returnableQuantity }, (_, index) => index + 1).map((count) => (
                                            <option key={count} value={count}>
                                                {count}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </fieldset>

                <MainForm<Values>
                    methods={methods}
                    fields={fields}
                    onSubmit={submit}
                    renderFooter={({ canSubmit }) => (
                        <div className="flex flex-col gap-3 border-t border-mist-100 pt-4">
                            {reason && chosen.length > 0 && (
                                <p className="text-sm text-mist-700">
                                    Once it&apos;s back and checked: <span className="font-semibold text-mist-950">{formatKobo(refundKobo)}</span>{" "}
                                    {problem ? (refundTo === "credit" ? "as store credit" : "to your card") : "as store credit"}
                                    {problem ? ", including its delivery." : ". Delivery isn't refunded for a change of mind."}
                                </p>
                            )}
                            <div className="flex justify-end gap-3">
                                <FormCancelButton onClick={onClose} disabled={busy} />
                                <Button
                                    type="submit"
                                    disabled={busy || !canSubmit || chosen.length === 0}
                                    className={cn(PRIMARY_BUTTON_CLASS, "disabled:bg-mist-200 disabled:opacity-100")}
                                >
                                    {busy ? "Sending..." : "Request return"}
                                </Button>
                            </div>
                            <Link href={RETURNS_URL} className="self-end text-xs text-mist-500 hover:underline">
                                See your returns
                            </Link>
                        </div>
                    )}
                />
            </DialogContent>
        </Dialog>
    );
}
