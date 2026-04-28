// Daily re-engagement digest — "حلالك في أمان"
// Schedule via pg_cron (e.g., daily 09:00). Sends a reassurance notification
// to owners who have been absent ≥ 3 days, listing up to 3 of their assets.
// Honors the per-owner `daily_digest_enabled` toggle on profiles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoff = threeDaysAgo.toISOString();

    // Absent owners who have the daily digest enabled
    const { data: absentOwners, error: ownersErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, last_seen_at, daily_digest_enabled")
      .eq("daily_digest_enabled", true)
      .or(`last_seen_at.lt.${cutoff},last_seen_at.is.null`);

    if (ownersErr) throw ownersErr;
    if (!absentOwners?.length) {
      return new Response(JSON.stringify({ sent: 0, owners: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const owner of absentOwners) {
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name, stability_index, image_url, status")
        .eq("owner_id", owner.user_id)
        .eq("is_active", true)
        .order("stability_index", { ascending: false })
        .limit(3);

      if (!assets?.length) continue;

      for (const asset of assets) {
        const index = Math.round(Number(asset.stability_index ?? 100));
        const title = `حلالك ${asset.name} في أمان 🌟`;
        const body = `مؤشر استقراره اليوم ${index}% — كل شيء على ما يرام`;

        const { error: insertErr } = await supabase.from("notifications").insert({
          owner_id: owner.user_id,
          asset_id: asset.id,
          type: "re_engagement",
          title,
          body,
          photo_url: asset.image_url,
          metadata: {
            stability_index: index,
            asset_name: asset.name,
            asset_status: asset.status,
            days_absent: 3,
          },
        });
        if (!insertErr) sentCount++;
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, owners: absentOwners.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("re-engagement error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
