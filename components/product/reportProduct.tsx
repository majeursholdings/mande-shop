"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { FormCancelButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LOGIN_URL, withNext } from "@/constant/auth";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { MandeApiError, api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// "Report this product": a signed-in customer tells MANDE something's wrong
// (fake, misleading, not allowed, a scam...). Super admins look into it. One
// open report per customer and product; signed out, they sign in first.
// ─────────────────────────────────────────────────────────────────────────────

const REASONS = [
    { value: "counterfeit", label: "It's fake or counterfeit" },
    { value: "misleading", label: "The photos or details are wrong or misleading" },
    { value: "prohibited", label: "It shouldn't be sold here" },
    { value: "scam", label: "It looks like a scam" },
    { value: "offensive", label: "It's offensive" },
    { value: "other", label: "Something else" },
] as const;

export default function ReportProduct({ slug, title }: { slug: string; title: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const { customer } = useCurrentCustomer();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>("");
    const [details, setDetails] = useState("");
    const [sending, setSending] = useState(false);

    const start = () => {
        if (!customer) {
            router.push(withNext(LOGIN_URL, pathname));
            return;
        }
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setReason("");
        setDetails("");
    };

    const send = async () => {
        if (!reason) return;
        setSending(true);
        try {
            await api.post("/shop/me/reports", { slug, reason, ...(details.trim() && { details: details.trim() }) });
            toast.success("Thanks for telling us. Our team will look into it.");
            close();
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "ALREADY_REPORTED") {
                toast.info(error.message);
                close();
                return;
            }
            toast.error(getErrorMessage(error, "We couldn't send your report. Please try again."));
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button type="button" onClick={start} className="flex cursor-pointer items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-error-700">
                <Flag className="size-3.5" aria-hidden />
                Report this product
            </button>
            <Dialog open={open} onOpenChange={(next) => !next && close()}>
                <DialogContent className="max-w-md">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Report this product</DialogTitle>
                        <DialogDescription>Tell us what&apos;s wrong with &ldquo;{title}&rdquo;. The seller won&apos;t see who reported it.</DialogDescription>
                    </div>
                    <div role="radiogroup" aria-label="What's wrong" className="flex flex-col gap-2">
                        {REASONS.map((option) => (
                            <label key={option.value} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm", reason === option.value ? "border-secondary-700 bg-secondary-50/40" : "border-mist-200")}>
                                <input type="radio" name="report-reason" value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} className="size-4 accent-secondary-700" />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="report-details" className="text-sm font-medium text-mist-950">
                            Anything else we should know? <span className="font-normal text-mist-500">(optional)</span>
                        </label>
                        <textarea
                            id="report-details"
                            value={details}
                            onChange={(event) => setDetails(event.target.value.slice(0, 1000))}
                            rows={3}
                            maxLength={1000}
                            className="w-full resize-y rounded-button border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <FormCancelButton onClick={close} disabled={sending} />
                        <Button type="button" onClick={send} disabled={!reason || sending} className={cn(PRIMARY_BUTTON_CLASS, "disabled:bg-mist-200 disabled:opacity-100")}>
                            {sending ? "Sending..." : "Send report"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
