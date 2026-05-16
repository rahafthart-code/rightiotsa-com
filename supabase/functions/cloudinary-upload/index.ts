// Edge function: proxy unsigned image uploads to Cloudinary so the
// CLOUD_NAME / UPLOAD_PRESET stay server-side. Returns secure URL +
// w_400,h_400,c_fill,g_auto thumbnail URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const UPLOAD_PRESET = Deno.env.get("CLOUDINARY_UPLOAD_PRESET");
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return new Response(
        JSON.stringify({ error: "Cloudinary not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Require authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inForm = await req.formData();
    const file = inForm.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: allowlist safe raster image MIME types only. SVG/HTML can
    // carry <script> payloads and would become stored-XSS if served raw.
    const ALLOWED_TYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    if (!ALLOWED_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({ error: "File type not allowed. Use JPEG, PNG, WebP, or GIF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fwd = new FormData();
    fwd.append("file", file);
    fwd.append("upload_preset", UPLOAD_PRESET);
    fwd.append("folder", `right_insurtech/${user.id}`);
    // Restrict server-side to image resource type as defense-in-depth.
    fwd.append("resource_type", "image");

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      { method: "POST", body: fwd },
    );
    const data = await cloudRes.json();
    if (!cloudRes.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || "Upload failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url: string = data.secure_url;
    const thumbnailUrl = url.replace(
      "/upload/",
      "/upload/w_400,h_400,c_fill,g_auto,q_auto,f_auto/",
    );

    return new Response(
      JSON.stringify({
        url,
        thumbnailUrl,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("cloudinary-upload error", e);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
