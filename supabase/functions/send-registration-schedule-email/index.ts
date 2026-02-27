import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_TEMPLATE = {
  show_title: 'Beauty and the Beast',
  subject_template: '{{Title of the Show}} Audition Details - Please Review',
  body_template: `Hi {{Student Name}} and Family,

We're excited to get auditions underway for {{Title of the Show}} - thank you for signing up!

Please review the required audition materials for:
- Belle
- Lumiere
- Mrs. Potts
- Gaston
- Le Feu

All songs, tracks, and instructions are here:
https://practice-batb.adcatheatre.com/

Each student will be assigned:
- Dance Day: {{Dance Day Date}} ({{Dance Start Time}}-{{Dance End Time}})
- Vocal Day: {{Vocal Day Date}} ({{Vocal Start Time}}-{{Vocal End Time}})

Please also keep callback date(s) - {{Callback Date(s)}} ({{Callback Start Time}}-{{Callback End Time}}) - open in case your student is invited back.

Students should come prepared and comfortable with the posted materials. The more prepared they are, the more confident and focused they'll feel in the room.

We're looking forward to a strong, fun start to the season. Thank you for being part of it!

Warmly,
[Your Name]
[Production Team / Organization Name]`,
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

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return 'TBD';
  const d = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatTime(timeValue: string | null | undefined) {
  if (!timeValue) return 'TBD';
  const [h, m] = timeValue.split(':');
  if (!h || !m) return 'TBD';
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 'TBD';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function applyTemplate(template: string, tokens: Record<string, string>) {
  let output = template;
  Object.entries(tokens).forEach(([key, value]) => {
    output = output.split(key).join(value);
  });
  return output;
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textToSimpleHtml(text: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;white-space:pre-wrap">${escapeHtml(text)}</div>`;
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

  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey || !emailFrom) {
    return jsonResponse(500, { error: 'Missing function secrets configuration' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData?.user?.id) {
    return jsonResponse(401, { error: 'Invalid user token' });
  }

  let payload: { studentId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const studentId = payload.studentId?.trim();
  if (!studentId) {
    return jsonResponse(400, { error: 'studentId is required' });
  }

  const { data: student, error: studentError } = await userClient
    .from('students')
    .select('id, family_account_id, registration_complete, first_name, last_name, parent_email, parent2_email')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student) {
    return jsonResponse(404, { error: 'Student not found' });
  }

  if (student.family_account_id !== authData.user.id) {
    return jsonResponse(403, { error: 'Student does not belong to this account' });
  }

  if (student.registration_complete !== true) {
    return jsonResponse(400, { error: 'Registration is not complete for this student' });
  }

  const { error: assignError } = await userClient.rpc('auto_assign_vocal_day_for_registration', {
    p_student_id: student.id,
  });
  if (assignError) {
    return jsonResponse(400, { error: assignError.message || 'Failed to auto-assign vocal day' });
  }

  const [{ data: assignment }, { data: configs }, { data: templateRow }] = await Promise.all([
    userClient
      .from('vocal_day_assignments')
      .select('audition_date')
      .eq('student_id', student.id)
      .maybeSingle(),
    userClient
      .from('audition_window_config')
      .select('audition_date, dance_start_time, dance_end_time, vocal_start_time, vocal_end_time, callback_start_time, callback_end_time')
      .order('audition_date', { ascending: true }),
    userClient
      .from('registration_email_templates')
      .select('show_title, subject_template, body_template')
      .eq('template_key', 'registration_schedule')
      .maybeSingle(),
  ]);

  const configRows = configs || [];
  const danceConfig = configRows.find((c) => c.dance_start_time && c.dance_end_time) || null;
  const vocalConfig = assignment?.audition_date
    ? configRows.find((c) => c.audition_date === assignment.audition_date) || null
    : null;
  const callbackConfigs = configRows.filter((c) => c.callback_start_time && c.callback_end_time);

  const callbackDateText = callbackConfigs.length > 0
    ? callbackConfigs.map((c) => formatDate(c.audition_date)).join(', ')
    : 'TBD';
  const callbackStartText = callbackConfigs.length > 0
    ? formatTime(callbackConfigs[0].callback_start_time)
    : 'TBD';
  const callbackEndText = callbackConfigs.length > 0
    ? formatTime(callbackConfigs[0].callback_end_time)
    : 'TBD';

  const template = templateRow || DEFAULT_TEMPLATE;
  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';

  const tokens: Record<string, string> = {
    '{{Title of the Show}}': template.show_title || DEFAULT_TEMPLATE.show_title,
    '{{Student Name}}': studentName,
    '{{Dance Day Date}}': formatDate(danceConfig?.audition_date),
    '{{Dance Start Time}}': formatTime(danceConfig?.dance_start_time),
    '{{Dance End Time}}': formatTime(danceConfig?.dance_end_time),
    '{{Vocal Day Date}}': formatDate(assignment?.audition_date),
    '{{Vocal Start Time}}': formatTime(vocalConfig?.vocal_start_time),
    '{{Vocal End Time}}': formatTime(vocalConfig?.vocal_end_time),
    '{{Callback Date(s)}}': callbackDateText,
    '{{Callback Start Time}}': callbackStartText,
    '{{Callback End Time}}': callbackEndText,
  };

  const subject = applyTemplate(template.subject_template || DEFAULT_TEMPLATE.subject_template, tokens);
  const textBody = applyTemplate(template.body_template || DEFAULT_TEMPLATE.body_template, tokens);

  const recipients = [student.parent_email, student.parent2_email]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase());
  const uniqueRecipients = [...new Set(recipients)];

  if (uniqueRecipients.length === 0) {
    return jsonResponse(400, { error: 'No parent email found for this student' });
  }

  const resendPayload: Record<string, unknown> = {
    from: emailFrom,
    to: uniqueRecipients,
    subject,
    text: textBody,
    html: textToSimpleHtml(textBody),
  };
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
    return jsonResponse(502, { error: 'Resend API request failed', details: resendBody });
  }

  return jsonResponse(200, {
    ok: true,
    studentId: student.id,
    vocalDay: assignment?.audition_date || null,
    messageId: resendBody?.id || null,
  });
});
