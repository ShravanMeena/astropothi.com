#!/usr/bin/env node
/**
 * Send ONE real WhatsApp message. Costs money; never run from the test suite.
 *
 *   node scripts/send_test_whatsapp.js 9660801827
 */
import config from "../config.js";
import * as MSG91 from "../server/messaging/msg91.js";

const to = process.argv[2];
if (!to) { console.error("usage: send_test_whatsapp.js <10-digit-number>"); process.exit(2); }
if (!MSG91.isLive()) {
  console.error("MSG91_AUTH_KEY / MSG91_WHATSAPP_NUMBER are not set — nothing would be sent.");
  process.exit(2);
}

console.log(`sending "${config.msg91.template}" from ${config.msg91.integratedNumber} to ${MSG91.toWhatsAppNumber(to)}`);
try {
  const r = await MSG91.sendTemplate({
    to, template: config.msg91.template, language: config.msg91.templateLang,
    body: ["Poonam Kumawat", "Kundali Dosh Report"], buttonUrlSuffix: "DFQCGJSH"
  });
  console.log("sent:", JSON.stringify(r.response ?? r, null, 1));
} catch (e) {
  console.error("failed:", e.message);
  if (e.body) console.error(JSON.stringify(e.body, null, 1));
  process.exit(1);
}
