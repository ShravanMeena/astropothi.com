// Invite-only free pilot.
//
// Ten seats, ten free reports each, nothing for sale. Kept as a MODE rather
// than a temporary hack so the paid credit-pack flow underneath stays intact
// and tested — flip PILOT_MODE=false and pricing returns unchanged.

import { Op } from "sequelize";
import db from "../../database/index.js";
import config from "../../config.js";
import * as Credits from "../credits/credits.service.js";

export const isOn = () => config.pilot.on;

/** During the pilot every report costs the same, so "10 free reports" is literal. */
export const creditCost = (reportType, catalogCredits) => (isOn() ? 1 : catalogCredits);

export const seatsTaken = () => db.Pandit.count({ where: { pilot_seat: { [Op.ne]: null } } });

export async function status() {
  const taken = await seatsTaken();
  return {
    on: isOn(),
    seats: config.pilot.seats,
    seats_taken: taken,
    seats_left: Math.max(0, config.pilot.seats - taken),
    free_reports: config.pilot.reports
  };
}

/** Validate an invite code and claim a seat. Returns the seat number. */
export async function claimSeat(pandit, code) {
  if (!isOn()) return null;
  if (pandit.pilot_seat) return pandit.pilot_seat;

  const given = String(code || "").trim().toUpperCase();
  if (given !== config.pilot.inviteCode) {
    throw Object.assign(new Error("BAD_INVITE"), { code: 403 });
  }

  // Serialise allocation so two people cannot both take the last seat.
  return db.sequelize.transaction(async (tx) => {
    const [row] = await db.sequelize.query(
      // Must match status()'s ORM count, which is paranoid-aware. Without the
      // deletedAt filter a removed pandit keeps holding his seat: the login
      // screen advertises places free while signup rejects everyone.
      `SELECT COUNT(*)::int AS count FROM pandits WHERE pilot_seat IS NOT NULL AND "deletedAt" IS NULL`,
      { type: db.Sequelize.QueryTypes.SELECT, transaction: tx, lock: tx.LOCK.UPDATE }
    );
    if (row.count >= config.pilot.seats) {
      throw Object.assign(new Error("PILOT_FULL"), { code: 409 });
    }
    const seat = row.count + 1;
    await pandit.update({ pilot_seat: seat, invite_code: given }, { transaction: tx });
    return seat;
  });
}

/**
 * Grant the free reports. Idempotent — keyed off trial_granted_at, so a second
 * call cannot mint a second allowance.
 */
export async function grantFreeReports(pandit) {
  if (!isOn() || pandit.trial_granted_at || !pandit.pilot_seat) return 0;
  await Credits.credit(pandit.id, config.pilot.reports, "trial",
    { note: `pilot seat ${pandit.pilot_seat}` });
  await pandit.update({ trial_granted_at: new Date() });
  return config.pilot.reports;
}
