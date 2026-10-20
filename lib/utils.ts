import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** An email with most of its name hidden, for "we sent a code to a***@example.ng". */
export function maskEmail(email: string): string {
    const at = email.indexOf("@");
    if (at < 1) return email;
    return `${email[0]}***${email.slice(at)}`;
}
