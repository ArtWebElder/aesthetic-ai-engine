/// <reference lib="deno.ns" />
// supabase/functions/send-notification-email/index.ts
// CREATYNG — Edge Function: send-notification-email
// Receives { notificationId }, fetches the admin_notification and target users,
// then logs the emails that would be sent (TODO: integrate Resend/SendGrid).
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { notificationId } = await req.json();
    if (!notificationId) {
      return json({ error: "missing_notification_id" }, 400, cors);
    }

    // Fetch the admin notification
    const { data: notif, error: notifErr } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notifErr || !notif) {
      return json({ error: "notification_not_found" }, 404, cors);
    }

    // Fetch target user emails from user_notifications join
    const { data: userNotifs, error: userErr } = await supabase
      .from("user_notifications")
      .select("user_id")
      .eq("admin_notification_id", notificationId);

    if (userErr) {
      console.error("[send-notification-email] error fetching user_notifications:", userErr);
      return json({ error: "fetch_users_failed" }, 500, cors);
    }

    const userIds = (userNotifs || []).map((un: { user_id: string }) => un.user_id);

    // Fetch emails from auth.users via profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const emails = (profiles || []).map((p: { email: string }) => p.email).filter(Boolean);

    // TODO: Actually send emails via Resend/SendGrid
    // For now, just log them
    console.log(`[send-notification-email] Would send "${notif.title}" to ${emails.length} users:`, emails.slice(0, 10));

    return json({
      success: true,
      notification_id: notificationId,
      emails_count: emails.length,
      preview: emails.slice(0, 5),
    }, 200, cors);
  } catch (err) {
    console.error("[send-notification-email] unexpected error:", err);
    return json({ error: "internal_error", detail: String(err) }, 500, cors);
  }
});
