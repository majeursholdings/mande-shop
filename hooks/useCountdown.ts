"use client";

import { useState, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// A countdown in whole seconds (e.g. "Resend in 0:42"), with no effect: the
// time comes from a clock store that ticks once a second while anything is
// listening, read with useSyncExternalStore. The deadline is state, so
// restart() is a plain state change in the click handler.
// ─────────────────────────────────────────────────────────────────────────────

const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
let now = Date.now();

function subscribeToClock(onTick: () => void) {
    clockListeners.add(onTick);
    if (!clockTimer) {
        now = Date.now();
        clockTimer = setInterval(() => {
            now = Date.now();
            clockListeners.forEach((listener) => listener());
        }, 1000);
    }
    return () => {
        clockListeners.delete(onTick);
        if (clockListeners.size === 0 && clockTimer) {
            clearInterval(clockTimer);
            clockTimer = null;
        }
    };
}

const getNow = () => now;
/** On the server the countdown hasn't started: it shows its full length. */
const getServerNow = () => 0;

export function useCountdown(seconds: number) {
    const [deadline, setDeadline] = useState(() => Date.now() + seconds * 1000);
    const current = useSyncExternalStore(subscribeToClock, getNow, getServerNow);
    const secondsLeft = current === 0 ? seconds : Math.min(seconds, Math.max(0, Math.ceil((deadline - current) / 1000)));
    const restart = () => setDeadline(Date.now() + seconds * 1000);
    return { secondsLeft, restart };
}
