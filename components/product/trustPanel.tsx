import Link from "next/link";
import { PROBLEM_ONLY_RETURNS, TRUST_POINTS } from "@/constant/trust";

/**
 * Why buying here is safe (constant/trust.ts): payment, delivery, returns,
 * verified sellers and help. A product that only goes back with a problem
 * says so in place of the 7-day returns promise.
 */
export default function TrustPanel({ changeOfMindReturns = true }: { changeOfMindReturns?: boolean }) {
    const points = changeOfMindReturns ? TRUST_POINTS : TRUST_POINTS.map((point) => (point.title === "7-day returns" ? PROBLEM_ONLY_RETURNS : point));
    return (
        <section aria-labelledby="trust-heading" className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
            <h2 id="trust-heading" className="mb-3 text-sm font-semibold text-neutral-900">
                Shop with confidence
            </h2>
            <ul className="flex flex-col gap-3">
                {points.map(({ icon: Icon, title, text, href }) => (
                    <li key={title} className="flex gap-3">
                        <Icon className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden />
                        <p className="text-sm text-neutral-700">
                            <span className="font-medium text-neutral-900">{title}.</span> {text}
                            {href && (
                                <>
                                    {" "}
                                    <Link href={href} className="font-medium text-primary-700 hover:underline">
                                        Learn more
                                    </Link>
                                </>
                            )}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
