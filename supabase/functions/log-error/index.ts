// Centralized backend error log endpoint.
// Inserts into edge_function_errors and emits a critical security_event
// when the same function errors >5 times in 15 minutes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  function_name: string;
  error_message: string;
  error_stack?: string;
  context?: Record<string, unknown>;
  status_code?: number;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = (await req.json()) as Body;
    if (!body?.function_name || !body?.error_message) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim very large payloads
    const trimmed = (s?: string, n = 4000) => (s ? s.slice(0, n) : s);

    await supabase.from("edge_function_errors").insert({
      function_name: body.function_name,
      error_message: trimmed(body.error_message)!,
      error_stack: trimmed(body.error_stack, 8000),
      context: body.context ?? {},
      status_code: body.status_code ?? 500,
      user_id: body.user_id ?? null,
    });

    // Burst detection (>5 per 15 min)
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("edge_function_errors")
      .select("id", { count: "exact", head: true })
      .eq("function_name", body.function_name)
      .gte("created_at", since);

    if ((count ?? 0) > 5) {
      await supabase.rpc("log_security_event", {
        p_type: "edge_function_error_burst",
        p_severity: "critical",
        p_endpoint: body.function_name,
        p_details: { count, window_minutes: 15 },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
