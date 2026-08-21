// Recording behaviour, and stitching an identity onto it after the fact.

import db from "../../database/index.js";

/** Event names the client is allowed to send. An open endpoint invites junk. */
export const EVENTS = {
  page_view: "browse", report_viewed: "browse", sample_opened: "browse",
  sample_page_turned: "browse", design_changed: "browse", guide_opened: "browse",
  guide_answered: "browse", guide_recommended: "browse",

  buy_clicked: "checkout", report_cta_click: "checkout", checkout_started: "checkout", checkout_field_error: "checkout",
  pay_clicked: "checkout", payment_redirected: "checkout", payment_returned: "checkout",
  order_ready: "checkout",

  report_opened: "report", report_downloaded: "report",
  reader_opened: "report", reader_page_turned: "report",

  signin_opened: "account", signin_otp_sent: "account", signed_in: "account",
  profile_saved: "account",

  chat_opened: "chat", chat_question: "chat",

  support_clicked: "support",
  coupon_applied: "checkout", coupon_rejected: "checkout",

  // How far down a page somebody got, and which parts they stopped at. The
  // funnel says whether they reached checkout; these say why they didn't —
  // lost in the first screen, or read to the chapter list and still walked.
  scroll_depth: "browse", section_viewed: "browse",

  // The welcome sheet: shown, taken, or closed — and HOW it was closed, since
  // the interesting number is not how many leave a phone number, it is how many
  // dismiss it on sight and whether they stay afterwards.
  welcome_shown: "account", welcome_submitted: "account",
  welcome_dismissed: "account", welcome_coupon_copied: "account",

  // Which language the report page was read in. Every scroll and section event
  // carries it too, so "does Hindi sell better" is answerable rather than felt.
  language_selected: "browse",

  // Engagement, as opposed to arrival. report_viewed fires the instant a report
  // page mounts; report_engaged waits for twelve seconds, a quarter of the page
  // or an act of intent. The Meta Pixel's ViewContent rides on the second one,
  // so the two must stay distinguishable here as well.
  report_engaged: "browse",

  // The promo strip and the pitch clip on the dosh page.
  banner_viewed: "browse", banner_dot_clicked: "browse", banner_clicked: "checkout",
  video_played: "browse", video_unmuted: "browse",

  // The free chart check. `done` carries whether the verdict came back positive
  // and whether a birth time was known, which is how we find out if giving the
  // answer away costs the sale or wins it.
  chart_check_started: "browse", chart_check_done: "browse",
  chart_check_failed: "browse",

  // The learn pages.
  learn_cta_clicked: "browse",

  // A URL nobody should have reached. A spike here is almost always a link we
  // broke ourselves.
  not_found: "browse"
};

const str = (v, n) => (v === undefined || v === null ? null : String(v).slice(0, n));

/**
 * Store a batch. Unknown event names are dropped rather than rejected — a stale
 * cached bundle must not fail the whole batch and lose the events beside it.
 */
export async function ingest(batch, ctx = {}) {
  const rows = [];
  for (const e of Array.isArray(batch) ? batch.slice(0, 50) : []) {
    const name = str(e?.name, 64);
    if (!name || !EVENTS[name]) continue;
    const anon = str(e?.anonymous_id ?? ctx.anonymous_id, 40);
    if (!anon) continue;

    rows.push({
      name, category: EVENTS[name],
      anonymous_id: anon,
      session_id: str(e?.session_id, 40),
      user_id: ctx.userId ?? null,
      path: str(e?.path, 300),
      referrer: str(e?.referrer, 300),
      source: str(e?.source, 80),
      medium: str(e?.medium, 80),
      campaign: str(e?.campaign, 120),
      properties: e?.properties && typeof e.properties === "object" ? e.properties : null,
      ua: str(ctx.ua, 300),
      ip: str(ctx.ip, 64),
      occurred_at: e?.occurred_at ? new Date(e.occurred_at) : new Date()
    });
  }
  if (!rows.length) return { stored: 0 };
  await db.AppEvent.bulkCreate(rows);
  return { stored: rows.length };
}

/**
 * Attach a person to a device, backwards as well as forwards.
 *
 * This is the whole reason anonymous_id exists: ten minutes of browsing happen
 * before anyone types a phone number, and that browsing is the interesting part.
 */
export async function identify(anonymousId, userId) {
  if (!anonymousId || !userId) return { linked: 0 };
  const [linked] = await db.AppEvent.update(
    { user_id: userId },
    { where: { anonymous_id: anonymousId, user_id: null } }
  );
  return { linked };
}

/** Everything one device ever did, in order — the journey, not the totals. */
export async function journey(anonymousId, limit = 500) {
  const rows = await db.AppEvent.findAll({
    where: { anonymous_id: anonymousId },
    order: [["occurred_at", "ASC"], ["id", "ASC"]], limit
  });
  return rows.map((r) => ({
    at: r.occurred_at, name: r.name, category: r.category, path: r.path,
    session: r.session_id, userId: r.user_id ? String(r.user_id) : null,
    props: r.properties || undefined
  }));
}
