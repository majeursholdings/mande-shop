"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** The product's photos: the chosen one large, and a row of thumbnails to switch between them. */
export default function ProductGallery({ images, title }: { images: { url: string; alt: string }[]; title: string }) {
    const [selected, setSelected] = useState(0);
    const current = images[selected] ?? images[0];

    if (!current) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-mist-100 text-mist-400">
                <ImageOff className="size-10" aria-hidden />
                <span className="sr-only">No photos of {title} yet</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-mist-100">
                <Image src={current.url} alt={current.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>

            {images.length > 1 && (
                <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Photos">
                    {images.map((image, index) => (
                        <li key={image.url}>
                            <button
                                type="button"
                                onClick={() => setSelected(index)}
                                aria-label={`Show photo ${index + 1} of ${images.length}`}
                                aria-pressed={index === selected}
                                className={cn(
                                    "relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-mist-100 outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
                                    index === selected ? "border-primary" : "border-transparent hover:border-primary-300",
                                )}
                            >
                                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
