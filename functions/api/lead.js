// Cloudflare Pages Function: receives the site's forms at POST /api/lead.
// Every lead goes two places at once:
//   1. Lofty, assigned to Todd, with Lofty's new-lead alert email.
//   2. An email straight to Todd's inbox, sent through Resend.
// The visitor sees the thank-you page if at least one of the two worked.
//
// Encrypted environment variables in the Cloudflare Pages project:
//   LOFTY_API_KEY    Lofty: Settings > Integrations > API
//   RESEND_API_KEY   Resend: API Keys (sending access is enough)
//   LEAD_EMAIL_TO    optional; defaults to the address in lib/lead.js
// Whichever key is missing, that route is simply skipped.
//
// Lofty API reference: https://developer.lofty.com/api-reference/leads/create-lead
// Resend API reference: https://resend.com/docs/api-reference/emails/send-email

import {
  FORMS,
  ERROR_PAGE,
  LOFTY_LEADS_URL,
  RESEND_EMAILS_URL,
  LEAD_EMAIL_TO,
  buildLead,
  buildLeadEmail,
} from "../../lib/lead.js";

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;
  const redirect = (path) => Response.redirect(origin + path, 303);

  let data;
  try {
    data = await request.formData();
  } catch {
    return redirect(ERROR_PAGE);
  }

  const field = (name, max = 500) => String(data.get(name) ?? "").trim().slice(0, max);

  const form = FORMS[field("form", 20)];
  if (!form) return redirect(ERROR_PAGE);

  // Bots fill in the hidden "website" field; people never see it.
  if (field("website")) return redirect(form.thanks);

  const values = {
    name: field("name", 80),
    email: field("email", 120),
    phone: field("phone", 30),
    address: field("address", 200),
    timeline: field("timeline", 20),
    topic: field("topic", 20),
    message: field("message", 1500),
    consent: data.get("updates_consent") === "yes",
    page: field("page", 200),
  };

  const missing = form.required.filter((key) => !values[key]);
  if (missing.length || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return redirect(ERROR_PAGE);
  }

  const now = new Date();
  const sends = [];

  if (env.LOFTY_API_KEY) {
    sends.push(
      post("Lofty", LOFTY_LEADS_URL, `token ${env.LOFTY_API_KEY}`, buildLead(form, values, now)),
    );
  }

  if (env.RESEND_API_KEY) {
    const to = env.LEAD_EMAIL_TO || LEAD_EMAIL_TO;
    sends.push(
      post("Resend", RESEND_EMAILS_URL, `Bearer ${env.RESEND_API_KEY}`, buildLeadEmail(form, values, { to, now })),
    );
  }

  if (!sends.length) {
    console.error("Neither LOFTY_API_KEY nor RESEND_API_KEY is set");
    return redirect(ERROR_PAGE);
  }

  const results = await Promise.all(sends);
  return redirect(results.some(Boolean) ? form.thanks : ERROR_PAGE);
}

// POST JSON and report whether it worked. Never throws.
async function post(name, url, authorization, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`${name} rejected the lead`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Could not reach ${name}`, err);
    return false;
  }
}
