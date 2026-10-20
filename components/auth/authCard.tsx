import type { ReactNode } from "react";

/**
 * The frame for the sign-in pages: a white card in the middle of the page,
 * under the shop's header, with a heading and a line of help.
 */
export default function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
    return (
        <main className="flex flex-1 items-start justify-center bg-mist-50 px-4 py-10 sm:py-16">
            <div className="w-full max-w-md rounded-2xl border border-mist-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-mist-950">{title}</h1>
                    {description && <p className="text-sm text-mist-500">{description}</p>}
                </div>
                {children}
            </div>
        </main>
    );
}
