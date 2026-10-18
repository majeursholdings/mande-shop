export const CURRENCY_SYMBOL = "₦";

/** The API sends whole kobo (₦1 = 100 kobo): 4500000 → "₦45,000", 4200050 → "₦42,000.50" (kobo only when there are some, then always two places) */
export function formatKobo(amountKobo: number): string {
    const fractionDigits = amountKobo % 100 === 0 ? 0 : 2;
    return `${CURRENCY_SYMBOL}${(amountKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
}
