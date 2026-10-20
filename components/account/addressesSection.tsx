"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/customForm";
import type { FormFieldConfig } from "@/components/customForm/types";
import { PHONE_PLACEHOLDER, validators } from "@/components/customForm/form.validators";
import { FormCancelButton, FormSubmitButton, PRIMARY_BUTTON_CLASS } from "@/components/customForm/formButtons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MAX_CUSTOMER_ADDRESSES, NIGERIAN_STATES, type NigerianState } from "@/constant/shop";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { accountService } from "@/lib/services/accountService";
import type { Address } from "@/lib/types/account";
import { cn } from "@/lib/utils";
import { AccountPanel, PanelSkeleton } from "./accountShell";

type AddressValues = { label: string; name: string; phone: string; street: string; city: string; state: string; isDefault: boolean };

// ─────────────────────────────────────────────────────────────────────────────
// Saved delivery addresses, for checkout: up to five, one of them the
// default. The API keeps exactly one default, so after each change the list
// it sends back replaces the one shown.
// ─────────────────────────────────────────────────────────────────────────────

const STATE_OPTIONS = NIGERIAN_STATES.map((state) => ({ label: state === "FCT" ? "FCT (Abuja)" : state, value: state }));

/** null: closed; "new": adding; an address: editing it. */
type Editing = null | "new" | Address;

export default function AddressesSection() {
    const queryClient = useQueryClient();
    const { customer } = useCurrentCustomer();
    // Only once signed in (the account frame sends anyone else to sign in)
    const { data: addresses, isPending, isError } = useQuery({ queryKey: queryKeys.customer.addresses(), queryFn: accountService.addresses, enabled: !!customer });
    const [editing, setEditing] = useState<Editing>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const saved = (list: Address[]) => {
        queryClient.setQueryData(queryKeys.customer.addresses(), list);
        void queryClient.invalidateQueries({ queryKey: queryKeys.customer.profile() });
    };

    const act = async (address: Address, work: () => Promise<Address[]>, done: string, failed: string) => {
        setBusyId(address.id);
        try {
            saved(await work());
            toast.success(done);
        } catch (error) {
            toast.error(getErrorMessage(error, failed));
        } finally {
            setBusyId(null);
        }
    };

    if (isPending) return <PanelSkeleton rows={2} />;

    const full = (addresses?.length ?? 0) >= MAX_CUSTOMER_ADDRESSES;

    return (
        <AccountPanel
            title="Addresses"
            description={`Where your orders can be delivered. Save up to ${MAX_CUSTOMER_ADDRESSES}.`}
            action={
                !isError && (
                    <Button type="button" onClick={() => setEditing("new")} disabled={full} className={cn(PRIMARY_BUTTON_CLASS, "gap-2 disabled:bg-mist-200 disabled:opacity-100")}>
                        <Plus className="size-4" aria-hidden />
                        Add address
                    </Button>
                )
            }
        >
            {isError ? (
                <p className="text-sm text-mist-700">We couldn&apos;t load your addresses. Refresh the page to try again.</p>
            ) : !addresses || addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-mist-300 px-6 py-10 text-center">
                    <MapPin className="size-6 text-mist-400" aria-hidden />
                    <p className="font-medium text-mist-950">No saved addresses yet</p>
                    <p className="text-sm text-mist-500">Add one now, or save it when you check out.</p>
                </div>
            ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                        <li key={address.id} className={cn("flex flex-col gap-3 rounded-xl border p-4", address.isDefault ? "border-secondary-700/40 bg-secondary-50/40" : "border-mist-200")}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-mist-950">{address.label || "Address"}</span>
                                {address.isDefault && <span className="rounded-full bg-secondary-700 px-2 py-0.5 text-xs font-medium text-white">Default</span>}
                            </div>
                            <address className="flex flex-col text-sm not-italic text-mist-700">
                                <span>{address.name}</span>
                                <span>{address.street}</span>
                                <span>
                                    {address.city}, {address.state === "FCT" ? "FCT (Abuja)" : address.state}
                                </span>
                                <span>{address.phone}</span>
                            </address>
                            <div className="mt-auto flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(address)} disabled={busyId === address.id} className="gap-1.5">
                                    <Pencil className="size-3.5" aria-hidden />
                                    Edit
                                </Button>
                                {!address.isDefault && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={busyId === address.id}
                                        className="gap-1.5"
                                        onClick={() => act(address, () => accountService.updateAddress(address.id, { isDefault: true }), "That's your default address now.", "We couldn't change your default address.")}
                                    >
                                        <Star className="size-3.5" aria-hidden />
                                        Make default
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={busyId === address.id}
                                    className="gap-1.5 text-error-600 hover:text-error-700"
                                    onClick={() => act(address, () => accountService.removeAddress(address.id), "Address removed.", "We couldn't remove that address.")}
                                >
                                    <Trash2 className="size-3.5" aria-hidden />
                                    Remove
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {editing && (
                <AddressDialog
                    address={editing === "new" ? null : editing}
                    isFirst={!addresses || addresses.length === 0}
                    onClose={() => setEditing(null)}
                    onSaved={(list) => {
                        saved(list);
                        setEditing(null);
                    }}
                />
            )}
        </AccountPanel>
    );
}

function AddressDialog({ address, isFirst, onClose, onSaved }: { address: Address | null; isFirst: boolean; onClose: () => void; onSaved: (addresses: Address[]) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AddressValues>({
        mode: "onTouched",
        defaultValues: {
            label: address?.label ?? "",
            name: address?.name ?? "",
            phone: address?.phone ?? "",
            street: address?.street ?? "",
            city: address?.city ?? "",
            state: address?.state ?? "",
            isDefault: address?.isDefault ?? isFirst,
        },
    });

    const fields: FormFieldConfig[] = [
        { name: "label", type: "text", label: "Label", placeholder: "Home, Office...", maxLength: 40 },
        { name: "name", type: "text", label: "Who receives it", autoComplete: "name", validation: validators.required("Who receives it") },
        { name: "phone", type: "tel", label: "Their phone number", placeholder: PHONE_PLACEHOLDER, autoComplete: "tel", validation: validators.phone() },
        { name: "street", type: "text", label: "Street address", autoComplete: "street-address", validation: validators.required("The street address") },
        { name: "city", type: "text", label: "City or town", autoComplete: "address-level2", validation: validators.required("The city or town") },
        { name: "state", type: "combobox", label: "State", options: STATE_OPTIONS, emptyMessage: "No state matches", validation: validators.required("The state") },
        // The default can be moved to an address, but not taken off it: choose another instead
        ...(address?.isDefault ? [] : [{ name: "isDefault", type: "checkbox" as const, label: "Use as my default address" }]),
    ];

    const handleSubmit = async ({ label, name, phone, street, city, state, isDefault }: AddressValues) => {
        setIsLoading(true);
        try {
            const input = { label: label.trim(), name: name.trim(), phone: phone.trim(), street: street.trim(), city: city.trim(), state: state as NigerianState };
            const list = address
                ? await accountService.updateAddress(address.id, { ...input, ...(isDefault && !address.isDefault && { isDefault: true }) })
                : await accountService.addAddress({ ...input, isDefault });
            toast.success(address ? "Address saved." : "Address added.");
            onSaved(list);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't save that address. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <div className="flex flex-col gap-1">
                    <DialogTitle>{address ? "Edit address" : "Add an address"}</DialogTitle>
                    <DialogDescription>Sellers use these details to deliver your order.</DialogDescription>
                </div>
                <MainForm<AddressValues>
                    methods={methods}
                    fields={fields}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    rowPairs={[["label", "name"], ["city", "state"]]}
                    renderFooter={({ isLoading, canSubmit }) => (
                        <div className="flex justify-end gap-3 pt-1">
                            <FormCancelButton onClick={onClose} disabled={isLoading} />
                            <FormSubmitButton label={address ? "Save address" : "Add address"} loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit} />
                        </div>
                    )}
                />
            </DialogContent>
        </Dialog>
    );
}
