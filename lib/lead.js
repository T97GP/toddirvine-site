// Shared lead logic for the site's forms (used by functions/api/lead.js).
// Kept outside functions/ so Cloudflare does not treat it as its own page route.

export const LOFTY_LEADS_URL = "https://api.lofty.com/v1.0/leads";

// Todd's Lofty user ID (memberUserId). Assigning directly skips the team's routing rules.
export const TODD_LOFTY_USER_ID = 844773269610416;

export const LEAD_SOURCE = "ToddIrvine.ca";

// Lofty lead type IDs
export const LEAD_TYPE = { seller: 1, buyer: 2, other: -1 };

// Timeline choices on the valuation form, mapped to Lofty's sellingTimeFrame values.
export const TIMEFRAMES = {
  "0-3": "1-3",
  "3-6": "3-6",
  "6-12": "6-12",
  "12+": "12+",
  curious: "Just Looking",
};

export const FORMS = {
  valuation: {
    label: "Home valuation request",
    leadType: LEAD_TYPE.seller,
    required: ["name", "email", "address"],
    thanks: "/sellers/home-valuation/thanks/",
  },
  contact: {
    label: "Contact form",
    leadType: LEAD_TYPE.other,
    required: ["name", "email"],
    thanks: "/thanks/",
  },
};

export const ERROR_PAGE = "/form-error/";

export function buildLead(form, v) {
  const [firstName, ...rest] = v.name.split(/\s+/);
  const phone = normalisePhone(v.phone);

  const note = [
    `${form.label} from ${LEAD_SOURCE}`,
    v.page && `Page: ${v.page}`,
    v.address && `Property: ${v.address}`,
    v.timeline && `Timeline: ${timelineLabel(v.timeline)}`,
    v.message && `Message: ${v.message}`,
    v.consent
      ? `Email updates: said yes (ticked the box on the form, ${new Date().toISOString()})`
      : "Email updates: did not ask for them",
  ]
    .filter(Boolean)
    .join("\n");

  const lead = {
    firstName: firstName || "Website",
    lastName: rest.join(" "),
    emails: [v.email],
    leadTypes: [form.leadType],
    source: LEAD_SOURCE,
    assignedUserId: TODD_LOFTY_USER_ID,
    tagsAdd: ["Website", form.label],
    content: note,
    leadAlert: true,
    welcomeEmail: false,
  };

  if (phone) lead.phones = [phone];
  if (v.address) lead.property = { streetAddress: v.address, state: "AB" };
  if (TIMEFRAMES[v.timeline]) lead.sellingTimeFrame = TIMEFRAMES[v.timeline];
  if (v.consent) lead.tagsAdd.push("Email updates consent");

  return lead;
}

function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw ? raw.slice(0, 20) : "";
}

function timelineLabel(value) {
  return {
    "0-3": "Within 3 months",
    "3-6": "3 to 6 months",
    "6-12": "6 to 12 months",
    "12+": "More than a year",
    curious: "Just curious",
  }[value] || value;
}
