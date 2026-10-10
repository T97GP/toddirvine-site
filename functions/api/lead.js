// Cloudflare Pages Function: receives the site's forms at POST /api/lead
// and creates the lead in Lofty, assigned to Todd, with Lofty's new-lead alert email.
//
// Needs one encrypted environment variable in the Cloudflare Pages project:
//   LOFTY_API_KEY   (Lofty: Settings > Integrations > API)
//
// Lofty API reference: https://developer.lofty.com/api-reference/leads/create-lead

import { FORMS, ERROR_PAGE, LOFTY_LEADS_URL, buildLead } from "../../lib/lead.js";

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
    message: field("message", 1500),
    consent: data.get("updates_consent") === "yes",
    page: field("page", 200),
  };

  const missing = form.required.filter((key) => !values[key]);
  if (missing.length || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return redirect(ERROR_PAGE);
  }

  if (!env.LOFTY_API_KEY) {
    console.error("LOFTY_API_KEY is not set");
    return redirect(ERROR_PAGE);
  }

  const lead = buildLead(form, values);

  try {
    const res = await fetch(LOFTY_LEADS_URL, {
      method: "POST",
      headers: {
        Authorization: `token ${env.LOFTY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error("Lofty rejected the lead", res.status, await res.text());
      return redirect(ERROR_PAGE);
    }
  } catch (err) {
    console.error("Could not reach Lofty", err);
    return redirect(ERROR_PAGE);
  }

  return redirect(form.thanks);
}
