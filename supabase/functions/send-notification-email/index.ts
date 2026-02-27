import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse(401, { error: 'Missing Authorization header' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  const emailReplyTo = Deno.env.get('EMAIL_REPLY_TO');

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, { error: 'Supabase env vars are not configured' });
  }

  if (!resendApiKey || !emailFrom) {
    return jsonResponse(500, { error: 'Missing RESEND_API_KEY or EMAIL_FROM secret' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) {
    return jsonResponse(401, { error: 'Invalid user token' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse(403, { error: 'Unable to verify staff role' });
  }

  if (!profile || !['admin', 'director'].includes(profile.role)) {
    return jsonResponse(403, { error: 'Only staff can send notifications' });
  }

  let payload: { to?: string; subject?: string; text?: string; html?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const text = payload.text?.trim();
  const html = payload.html?.trim();

  if (!to || !subject || (!text && !html)) {
    return jsonResponse(400, { error: 'Required fields: to, subject, and text or html' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return jsonResponse(400, { error: 'Invalid recipient email' });
  }

  const resendPayload: Record<string, unknown> = {
    from: emailFrom,
    to: [to],
    subject,
  };
  if (text) resendPayload.text = text;
  if (html) resendPayload.html = html;
  if (emailReplyTo) resendPayload.reply_to = emailReplyTo;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resendPayload),
  });

  const resendBody = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    return jsonResponse(502, {
      error: 'Resend API request failed',
      details: resendBody,
    });
  }

  return jsonResponse(200, {
    ok: true,
    id: resendBody?.id || null,
  });
});
