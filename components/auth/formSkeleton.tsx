import { Skeleton } from "@/components/ui/skeleton";

/** Stands in for a form while the page reads its address (e.g. `?next=`): one block per field, then the button. */
export default function FormSkeleton({ fields = 2 }: { fields?: number }) {
    return (
        <div className="flex flex-col gap-4" aria-hidden>
            {Array.from({ length: fields }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                </div>
            ))}
            <Skeleton className="mt-1 h-11 w-full" />
        </div>
    );
}
