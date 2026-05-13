import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Returns the active subscription for the logged-in user (or null while loading).
// Status considered "valid" = 'active' OR 'trial' with future trial_ends_at.
export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) { setSubscription(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription(data ?? null);
        setLoading(false);
      }
    }
    load();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => { cancelled = true; authSub.unsubscribe(); };
  }, []);

  const isActive = (() => {
    if (!subscription) return false;
    if (subscription.status === "active") return true;
    if (subscription.status === "trial") {
      const t = subscription.trial_ends_at ? new Date(subscription.trial_ends_at).getTime() : 0;
      return t > Date.now();
    }
    return false;
  })();

  return { subscription, loading, isActive };
}
