import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars filled to the nearest half, the average, and how many reviews it's from. Nothing when there are no reviews yet. */
export default function RatingSummary({ rating, className }: { rating: { average: number; count: number }; className?: string }) {
    if (rating.count === 0) return <p className={cn("text-sm text-muted-foreground", className)}>No reviews yet</p>;

    const rounded = Math.round(rating.average * 2) / 2;
    return (
        <p className={cn("flex items-center gap-2 text-sm text-neutral-700", className)}>
            <span className="flex items-center" aria-hidden>
                {Array.from({ length: 5 }, (_, index) => {
                    const fill = Math.max(0, Math.min(1, rounded - index));
                    return (
                        <span key={index} className="relative">
                            <Star className="size-4 text-neutral-300" />
                            {fill > 0 && (
                                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                                    <Star className="size-4 fill-warning-400 text-warning-400" />
                                </span>
                            )}
                        </span>
                    );
                })}
            </span>
            <span>
                <span className="font-medium text-neutral-900">{rating.average.toFixed(1)}</span>
                <span className="sr-only"> out of 5</span>
                <span className="text-muted-foreground">
                    {" "}
                    ({rating.count} {rating.count === 1 ? "review" : "reviews"})
                </span>
            </span>
        </p>
    );
}
