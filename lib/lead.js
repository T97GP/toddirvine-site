// Shared lead logic for the site's forms (used by functions/api/lead.js).
// Kept outside functions/ so Cloudflare does not treat it as its own page route.

export const LOFTY_LEADS_URL = "https://api.lofty.com/v1.0/leads";
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

// Todd's Lofty user ID (memberUserId). Assigning directly skips the team's routing rules.
export const TODD_LOFTY_USER_ID = 844773269610416;

export const LEAD_SOURCE = "ToddIrvine.ca";

// Where the direct lead email goes, and who it comes from.
// The "from" address only works once toddirvine.ca is verified in Resend.
export const LEAD_EMAIL_TO = "tirvinerealestate@gmail.com";
export const LEAD_EMAIL_FROM = "ToddIrvine.ca <leads@toddirvine.ca>";

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

// "What can I help with?" on the contact form, mapped to Lofty lead types.
export const TOPICS = {
  buying: { label: "Buying", leadTypes: [LEAD_TYPE.buyer] },
  selling: { label: "Selling", leadTypes: [LEAD_TYPE.seller] },
  both: { label: "Buying and selling", leadTypes: [LEAD_TYPE.buyer, LEAD_TYPE.seller] },
  medical: {
    label: "Moving here for a healthcare job",
    leadTypes: [LEAD_TYPE.buyer],
    tag: "Medical professional relocation",
  },
  other: { label: "Something else", leadTypes: [LEAD_TYPE.other] },
};

export const FORMS = {
  valuation: {
    label: "Home valuation request",
    leadTypes: [LEAD_TYPE.seller],
    required: ["name", "email", "address"],
    thanks: "/sellers/home-valuation/thanks/",
  },
  contact: {
    label: "Contact form",
    leadTypes: [LEAD_TYPE.other],
    required: ["name", "email"],
    thanks: "/thanks/",
  },
};

export const ERROR_PAGE = "/form-error/";

// The details a person entered, as labelled lines (shared by the Lofty note and the email).
function detailLines(v) {
  const topic = TOPICS[v.topic];
  return [
    topic && `Looking for help with: ${topic.label}`,
    v.address && `Property: ${v.address}`,
    v.timeline && `Timeline: ${timelineLabel(v.timeline)}`,
    v.message && `Message: ${v.message}`,
  ].filter(Boolean);
}

function consentLine(v, when) {
  return v.consent
    ? `Email updates: said yes (ticked the box on the form, ${when})`
    : "Email updates: did not ask for them";
}

export function buildLead(form, v, now = new Date()) {
  const [firstName, ...rest] = v.name.split(/\s+/);
  const phone = normalisePhone(v.phone);
  const topic = TOPICS[v.topic];

  const note = [
    `${form.label} from ${LEAD_SOURCE}`,
    v.page && `Page: ${v.page}`,
    ...detailLines(v),
    consentLine(v, now.toISOString()),
  ]
    .filter(Boolean)
    .join("\n");

  const lead = {
    firstName: firstName || "Website",
    lastName: rest.join(" "),
    emails: [v.email],
    leadTypes: topic ? topic.leadTypes : form.leadTypes,
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
  if (topic && topic.tag) lead.tagsAdd.push(topic.tag);
  if (v.consent) lead.tagsAdd.push("Email updates consent");

  return lead;
}

// The email Todd gets for every form. Replying goes straight to the person who sent it.
export function buildLeadEmail(form, v, { to = LEAD_EMAIL_TO, now = new Date() } = {}) {
  const received = mountainTime(now);
  const oneLine = (s) => s.replace(/[\r\n]+/g, " ");

  const lines = [
    `New ${form.label.toLowerCase()} from ${LEAD_SOURCE}`,
    "",
    `Name: ${v.name}`,
    `Email: ${v.email}`,
    v.phone ? `Phone: ${v.phone}` : null,
    ...detailLines(v),
    "",
    consentLine(v, received),
    v.page ? `Sent from: ${v.page}` : null,
    `Received: ${received}`,
    "",
    "Hit reply to answer them directly.",
  ].filter((line) => typeof line === "string");

  return {
    from: LEAD_EMAIL_FROM,
    to: [to],
    reply_to: v.email,
    subject: oneLine(`New ${form.label.toLowerCase()}: ${v.name}`).slice(0, 150),
    text: lines.join("\n"),
  };
}

function mountainTime(date) {
  try {
    return (
      date.toLocaleString("en-CA", {
        timeZone: "America/Edmonton",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " (Alberta time)"
    );
  } catch {
    return date.toISOString();
  }
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
