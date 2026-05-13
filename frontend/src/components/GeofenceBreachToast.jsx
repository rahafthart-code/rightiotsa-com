import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

// Listens to realtime inserts on `notifications` for the current user.
// Surfaces a prominent toast for `zone_breach`, `danger_alert`, `warning_alert`.
// Plays the bundled alert.mp3 once per critical event.
export default function GeofenceBreachToast() {
  useEffect(() => {
    let channel;
    let cancelled = false;
    let audio;
    try {
      audio = new Audio("/alert.mp3");
      audio.volume = 0.6;
    } catch { /* ignore */ }

    async function start() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      const userId = session.user.id;

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `owner_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new;
            if (!n) return;
            const isCritical = n.type === "zone_breach" || n.type === "danger_alert";
            if (isCritical) {
              try { audio?.play().catch(() => {}); } catch { /* ignore */ }
              toast.error(n.title || "Alert", {
                description: n.body,
                duration: 8000,
              });
            } else if (n.type === "warning_alert") {
              toast.warning(n.title || "Warning", {
                description: n.body,
                duration: 6000,
              });
            } else {
              toast(n.title || "Notification", { description: n.body });
            }
          },
        )
        .subscribe();
    }

    start();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (channel) supabase.removeChannel(channel);
      start();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
