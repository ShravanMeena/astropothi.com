#!/usr/bin/env node
/**
 * WhatsApp delivery contract.
 *
 * Runs entirely in dry-run, so it proves the important things without spending
 * a message: the right person is addressed, the variables carry the right
 * values, the button gets the order id, and — the one that actually costs money
 * if it is wrong — a buyer is never messaged twice for one order.
 */
import db from "../database/index.js";
import config from "../config.js";
import * as MSG91 from "../server/messaging/msg91.js";
import * as Notify from "../server/messaging/notify.service.js";

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

console.log("whatsapp (msg91)\n");

console.log("number normalisation");
is("10 digits gain the country code", MSG91.toWhatsAppNumber("9660801827"), "919660801827");
is("already prefixed is left alone", MSG91.toWhatsAppNumber("919660801827"), "919660801827");
is("+91 and spaces are stripped", MSG91.toWhatsAppNumber("+91 96608 01827"), "919660801827");
is("a leading zero is replaced", MSG91.toWhatsAppNumber("09660801827"), "919660801827");
is("empty is refused", MSG91.toWhatsAppNumber(""), null);

console.log("\npayload");
const p = MSG91.buildPayload({
  to: "919660801827", template: "booking_confirmation_pothi_reports",
  body: ["Poonam Kumawat", "Health Report"], buttonUrlSuffix: "I9GPXV_X", language: "en"
});
const comp = p.payload.template.to_and_components[0].components;
is("template name", p.payload.template.name, "booking_confirmation_pothi_reports");
is("recipient", p.payload.template.to_and_components[0].to, ["919660801827"]);
is("{{1}} is the buyer's name", comp.body_1, { type: "text", value: "Poonam Kumawat" });
is("{{2}} is the report", comp.body_2, { type: "text", value: "Health Report" });
is("the button carries only the order id", comp.button_1,
   { subtype: "url", type: "text", value: "I9GPXV_X" });

console.log("\ndelivery rules");
// npm run test:whatsapp blanks the auth key on purpose: this suite must never
// be able to send a real message, nor fail because MSG91 is having a bad day.
is("the suite runs in dry-run, never sending", MSG91.isLive(), false);

// A throwaway order, exercised through the real notifier.
const order = await db.Order.create({
  public_id: `WATEST${Date.now().toString(36).slice(-4).toUpperCase()}`,
  report_type: "health", design: "heritage", palette: "gold", language: "en",
  buyer_name: "Poonam Kumawat", buyer_phone: "9660801827",
  amount_paise: 29900, gst_paise: 4561, status: "created"
});

is("an unpaid order is never messaged", (await Notify.reportReady(order)).skipped, "status created");

await order.update({ status: "ready" });
const first = await Notify.reportReady(order);
is("a ready order builds a message", first.dryRun, true);
is("addressed to the buyer", first.payload?.payload?.template?.to_and_components?.[0]?.to, ["919660801827"]);
is("the button carries this order's id",
   first.payload?.payload?.template?.to_and_components?.[0]?.components?.button_1?.value, order.public_id);
is("dry-run does not claim to have sent", Boolean(order.whatsapp_sent_at), false);

// Pretend it went out, then prove a retry does not repeat it.
await order.update({ whatsapp_sent_at: new Date() });
is("a second settlement does not message again", (await Notify.reportReady(order)).skipped, "already sent");

await order.update({ whatsapp_sent_at: null, buyer_phone: null });
is("no phone is skipped, not crashed", (await Notify.reportReady(order)).skipped, "no phone");

// It must never be able to fail an order.
const broken = { public_id: "X", status: "ready", buyer_phone: "9660801827",
                 update: async () => { throw new Error("db gone"); } };
let threw = false;
try { await Notify.reportReady(broken); } catch { threw = true; }
is("a messaging failure never throws into the payment path", threw, false);

await order.destroy({ force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
