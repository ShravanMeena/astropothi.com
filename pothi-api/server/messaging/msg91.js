// MSG91 WhatsApp — the transport only. Nothing in here knows what a report is.
//
// The payload below follows MSG91's v5 bulk WhatsApp template API. Their docs
// render client-side and could not be read programmatically, so this shape is
// written to be corrected in ONE place: if the cURL from the MSG91 template
// screen differs, change `buildPayload` and nothing else moves.
//
// With no auth key configured the client is in dry-run: it returns the payload
// it would have posted and sends nothing. That keeps the delivery path testable
// on a laptop and makes "did we try to message the right person" answerable
// without spending a message.

import dns from "node:dns";
import config from "../../config.js";

// MSG91 auth keys are IP-whitelisted, and a machine with both stacks will reach
// them over IPv6 by default — where the whitelisted IPv4 address means nothing
// and every call comes back 401 Unauthorized with no hint as to why.
// Preferring A records makes our outbound address the one that was whitelisted.
// It is process-wide, which is what we want: any vendor that whitelists us
// should see one predictable IP.
dns.setDefaultResultOrder("ipv4first");

const ENDPOINT = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

export const isLive = () =>
  Boolean(config.msg91.authKey && config.msg91.integratedNumber);

/** 10 digits → 91XXXXXXXXXX, which is what WhatsApp expects. */
export function toWhatsAppNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

/**
 * @param {object} o
 * @param {string} o.to                 recipient, any Indian format
 * @param {string} o.template           approved template name
 * @param {string[]} o.body             body variables in order: {{1}}, {{2}}, …
 * @param {string} [o.buttonUrlSuffix]  the dynamic part of a URL button
 */
export function buildPayload({ to, template, body = [], buttonUrlSuffix, language }) {
  const components = {};
  body.forEach((value, i) => {
    components[`body_${i + 1}`] = { type: "text", value: String(value ?? "") };
  });
  if (buttonUrlSuffix) {
    components.button_1 = { subtype: "url", type: "text", value: String(buttonUrlSuffix) };
  }
  return {
    integrated_number: config.msg91.integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: template,
        language: { code: language || config.msg91.templateLang, policy: "deterministic" },
        namespace: config.msg91.namespace || undefined,
        to_and_components: [{ to: [to], components }]
      }
    }
  };
}

export async function sendTemplate(opts) {
  const to = toWhatsAppNumber(opts.to);
  if (!to) throw new Error("no recipient number");
  const payload = buildPayload({ ...opts, to });

  if (!isLive()) {
    console.log(`[whatsapp:dry-run] ${opts.template} → ${to}`,
      JSON.stringify(payload.payload.template.to_and_components[0].components));
    return { sent: false, dryRun: true, payload };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authkey: config.msg91.authKey, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }

  // MSG91 answers 200 with a failure body often enough that the status alone is
  // not proof of delivery — treat anything that is not an explicit success as a
  // failure, so it lands in whatsapp_error rather than looking sent.
  const okStatus = res.ok && String(body?.type || body?.status || "").toLowerCase() !== "error";
  if (!okStatus) {
    const detail = body?.errors || body?.message || `MSG91 ${res.status}`;
    const hint = res.status === 401
      ? " — check the auth key and that this server's public IP is whitelisted on it"
      : /no subscription|not integrated/i.test(String(detail))
        ? " — the sender number has no active WhatsApp subscription on this MSG91 account"
        : "";
    throw Object.assign(new Error(`${detail}${hint}`), { status: res.status, body });
  }
  return { sent: true, dryRun: false, response: body };
}
