#!/usr/bin/env node
/**
 * Prices and coupons.
 *
 * The one rule worth defending here: what the buyer is charged must come from
 * our arithmetic, never from anything the browser posts. So every check below
 * ends at the amount that reaches the order row, not at what the API replied
 * to the coupon form. A coupon that validates but does not survive to the
 * order is worse than no coupon, and a coupon that survives when it should
 * have expired is money leaving the business quietly.
 */
import { execSync } from "node:child_process";
import config from "../config.js";

const API = process.env.API || "http://localhost:4050";
const DB = config.db.name;
let pass = 0, fail = 0;

const is = (name, got, want) => {
  const okk = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${okk ? "✓" : "✗"} ${name}${okk ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  okk ? pass++ : fail++;
};

const call = async (path, { token, method = "GET", body } = {}) => {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};
// Multi-line SQL is fine to write, but JSON.stringify escapes the newlines
// into literal \n which psql then chokes on — flatten first.
const q = (sql) => execSync(`psql -d ${DB} -t -A -c ${JSON.stringify(sql.replace(/\s+/g, " ").trim())}`, { encoding: "utf8" }).trim();

if (!config.otpBypass) {
  console.error("  ✗ OTP_BYPASS must be set to run this suite");
  process.exit(1);
}

const TEST_CODES = ["TEST20", "TESTFLAT", "TESTEXP", "TESTONE", "TESTBAD", "TESTORDER"];
const cleanup = () => q(`DELETE FROM coupons WHERE code IN (${TEST_CODES.map((c) => `'${c}'`).join(",")})`);
cleanup();

const adminPhone = q(`SELECT phone FROM pandits WHERE is_admin AND status='active' AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
if (!adminPhone) {
  console.error("  ✗ no admin seeded — run: node scripts/ensure_admin.js <phone>");
  process.exit(1);
}
const login = await call("/noauth-api/v1/auth/otp/verify", {
  method: "POST", body: { phone: adminPhone, otp: config.otpBypass }
});
const T = login.json?.results?.admin_token;
const panditToken = login.json?.results?.token;

const catalogue = async () => {
  const r = await call("/noauth-api/v1/shop/catalogue");
  const res = r.json?.results;
  return Array.isArray(res) ? res : (res?.reports || []);
};
const priceOf = async (code) => (await catalogue()).find((r) => r.code === code)?.price_paise;

console.log("pricing");
const list = await call("/admin-api/v1/pricing", { token: T });
is("every report is priced", list.json?.results?.length, 8);
const kundli = list.json.results.find((r) => r.code === "kundli");
is("kundli is the flagship", kundli?.tier, "flagship");
is("with no override the tier price applies", kundli?.price_paise, kundli?.tier_paise);
const tierPrice = kundli.tier_paise;

await call("/admin-api/v1/pricing/kundli", { token: T, method: "PUT", body: { price_paise: 79900, note: "suite" } });
is("an override reaches the shop", await priceOf("kundli"), 79900);
is("the override is visible to staff",
   (await call("/admin-api/v1/pricing", { token: T })).json.results.find((r) => r.code === "kundli")?.override_paise, 79900);
is("a fat-fingered price is refused",
   (await call("/admin-api/v1/pricing/kundli", { token: T, method: "PUT", body: { price_paise: 5 } })).status, 400);
await call("/admin-api/v1/pricing/kundli", { token: T, method: "DELETE" });
is("clearing falls back to the tier", await priceOf("kundli"), tierPrice);

console.log("\ncoupons");
is("a percent coupon is created",
   (await call("/admin-api/v1/coupons", { token: T, method: "POST",
     body: { code: "test20", kind: "percent", value: 20, max_discount_paise: 20000 } })).json?.results?.code, "TEST20");
is("a 99% coupon is refused",
   (await call("/admin-api/v1/coupons", { token: T, method: "POST", body: { code: "TESTBAD", kind: "percent", value: 99 } })).status, 400);
is("a malformed code is refused",
   (await call("/admin-api/v1/coupons", { token: T, method: "POST", body: { code: "a b", kind: "flat", value: 100 } })).status, 400);

const quoted = await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TEST20", report_type: "kundli" } });
const disc = quoted.json?.results?.discount_paise;
// Asserted as properties rather than as a second copy of the arithmetic: a
// duplicated formula agrees with a wrong implementation.
is("the discount is at least 20% before rounding", disc >= Math.floor(tierPrice * 0.2), true);
is("the cap binds", disc <= 20000, true);
is("the discount is a whole number of rupees", disc % 100, 0);
is("so the buyer pays a whole number of rupees", (tierPrice - disc) % 100, 0);
is("the quote adds up", quoted.json?.results?.final_paise, tierPrice - disc);
is("an unknown code is rejected, not silently ignored",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "NOPE", report_type: "kundli" } })).json?.results?.ok ?? false, false);

await call("/admin-api/v1/coupons", { token: T, method: "POST",
  body: { code: "TESTFLAT", kind: "flat", value: 10000, report_types: ["love"] } });
is("a scoped coupon works on its own report",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TESTFLAT", report_type: "love" } })).json?.results?.discount_paise, 10000);
is("a scoped coupon does not leak to other reports",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TESTFLAT", report_type: "kundli" } })).json?.results?.ok ?? false, false);

q(`INSERT INTO coupons (code,kind,value,active,expires_at,"createdAt","updatedAt")
   VALUES ('TESTEXP','flat',10000,true,now()-interval '1 day',now(),now())`);
is("an expired coupon is rejected",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TESTEXP", report_type: "kundli" } })).json?.results?.ok ?? false, false);

q(`INSERT INTO coupons (code,kind,value,active,max_uses,uses,"createdAt","updatedAt")
   VALUES ('TESTONE','flat',10000,true,1,1,now(),now())`);
is("an exhausted coupon is rejected",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TESTONE", report_type: "kundli" } })).json?.results?.ok ?? false, false);

await call("/admin-api/v1/coupons/TEST20/active", { token: T, method: "POST", body: { active: false } });
is("deactivating stops it dead",
   (await call("/noauth-api/v1/shop/coupon", { method: "POST", body: { code: "TEST20", report_type: "kundli" } })).json?.results?.ok ?? false, false);

// ── the part that actually protects revenue ──────────────────────────────────
console.log("\nthe order, not the quote");
await call("/admin-api/v1/coupons", { token: T, method: "POST",
  body: { code: "TESTORDER", kind: "flat", value: 10000 } });

const birth = {
  name: "Coupon Suite", gender: "male", dob: "1990-05-15", tob: "10:30",
  pob: "Jaipur, Rajasthan, India", lat: 26.9124, lon: 75.7873,
  tz: "Asia/Kolkata", buyer_phone: "9812345678", language: "en"
};
const mkOrder = (body) => call("/noauth-api/v1/shop/order", { method: "POST", body });

const honest = await mkOrder({ report_type: "love", ...birth, coupon: "TESTORDER" });
const honestId = honest.json?.results?.public_id;
is("an order is created with the coupon", typeof honestId, "string");
if (honestId) {
  const row = q(`SELECT list_paise||'|'||discount_paise||'|'||amount_paise||'|'||coalesce(coupon_code,'')
                   FROM orders WHERE public_id='${honestId}'`);
  const [listP, disc, amt, code] = row.split("|");
  is("the order records the list price", Number(listP), await priceOf("love"));
  is("the order records the discount", Number(disc), 10000);
  is("the order charges list minus discount", Number(amt), Number(listP) - 10000);
  is("the order records which coupon", code, "TESTORDER");
}

// A browser that posts its own amount must be ignored.
const liar = await mkOrder({ report_type: "love", ...birth, coupon: "TESTORDER", amount_paise: 100, price_paise: 100 });
const liarId = liar.json?.results?.public_id;
if (liarId) {
  const amt = Number(q(`SELECT amount_paise FROM orders WHERE public_id='${liarId}'`));
  is("a posted amount is ignored", amt, (await priceOf("love")) - 10000);
}

// An expired coupon posted straight at the order endpoint must be refused
// outright rather than quietly dropped — a buyer who typed a dead code should
// be told, not charged full price without explanation.
const sneaky = await mkOrder({ report_type: "love", ...birth, coupon: "TESTEXP" });
is("an expired coupon posted directly is refused", sneaky.status, 400);
is("and the refusal says why", /expire|no longer|valid/i.test(sneaky.json?.message || ""), true);

// A limited coupon must burn on payment, not on order creation — otherwise a
// hundred abandoned carts exhaust a hundred-use code before anyone pays.
is("creating an order does not spend a use",
   Number(q(`SELECT uses FROM coupons WHERE code='TESTORDER'`)), 0);

console.log("\nnamespace");
is("a pandit token is refused", (await call("/admin-api/v1/pricing", { token: panditToken })).status, 403);
is("no token is refused", (await call("/admin-api/v1/pricing")).status, 401);

cleanup();
q(`DELETE FROM orders WHERE buyer_name='Coupon Suite'`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
