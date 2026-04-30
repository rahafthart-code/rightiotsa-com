// L6: auto sign-out after a period of inactivity.
// Resets on any meaningful user interaction.
import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout(timeoutMs = DEFAULT_MS) {
  const timer = useRef(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } finally {
          window.location.href = "/login?reason=timeout";
        }
      }, timeoutMs);
    };

    reset();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [timeoutMs]);
}
