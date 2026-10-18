// ─────────────────────────────────────────────────────────────────────────────
// The shop doesn't send analytics yet. MainForm reports form_start for a form
// given a `trackingName`; when the shop gets Tag Manager (behind cookie
// consent, like mande-frontend's lib/analytics.ts), name the tracked forms in
// TrackedFormName and push the event to window.dataLayer in trackEvent.
// ─────────────────────────────────────────────────────────────────────────────

/** The forms whose interactions are tracked. None yet. */
export type TrackedFormName = never;

export type TrackedEvent = { event: "form_start" | "form_submit" | "form_error"; form_name: TrackedFormName };

/** Records an event for analytics. Does nothing until the shop has Tag Manager. */
export function trackEvent(event: TrackedEvent): void {
    void event;
}
