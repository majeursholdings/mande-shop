export const CURRENCY_SYMBOL = "₦";

/** The API sends whole kobo (₦1 = 100 kobo): 4500000 → "₦45,000" */
export function formatKobo(amountKobo: number): string {
    return `${CURRENCY_SYMBOL}${(amountKobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}
