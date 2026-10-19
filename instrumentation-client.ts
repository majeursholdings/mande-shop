import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry";
import { API_BASE_URL } from "@/lib/site";

// Sentry in the browser: errors, page loads and navigations, and a replay of
// the moments before an error. Replays hide all text and inputs and block
// images and video, so no personal details are recorded.
Sentry.init({
    ...sentryBaseOptions,
    // Send trace headers to the API too, so a page and its API calls share one trace
    tracePropagationTargets: [new URL(API_BASE_URL).origin],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
