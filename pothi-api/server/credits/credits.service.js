import db from "../../database/index.js";

// Balance is always derived. There is no mutable balance column to drift.
export async function getBalance(panditId, tx) {
  const [row] = await db.sequelize.query(
    `SELECT COALESCE(SUM(delta), 0)::int AS balance FROM credit_ledger WHERE pandit_id = :pid`,
    { replacements: { pid: panditId }, type: db.Sequelize.QueryTypes.SELECT, transaction: tx }
  );
  return row.balance;
}

export async function credit(panditId, amount, reason, ref = {}, tx) {
  return db.CreditLedger.create(
    { pandit_id: panditId, delta: Math.abs(amount), reason, ref_type: ref.type, ref_id: ref.id, note: ref.note },
    { transaction: tx }
  );
}

export async function debit(panditId, amount, reason, ref = {}, tx) {
  return db.CreditLedger.create(
    { pandit_id: panditId, delta: -Math.abs(amount), reason, ref_type: ref.type, ref_id: ref.id, note: ref.note },
    { transaction: tx }
  );
}

/**
 * Lock the pandit row, check the balance, and debit — all inside one transaction
 * so two concurrent generates can't both spend the last credit.
 * Throws INSUFFICIENT_CREDITS if he can't afford it.
 */
export async function reserve(panditId, cost, tx) {
  await db.sequelize.query(`SELECT id FROM pandits WHERE id = :pid FOR UPDATE`, {
    replacements: { pid: panditId }, transaction: tx
  });
  const balance = await getBalance(panditId, tx);
  if (balance < cost) {
    const e = new Error("INSUFFICIENT_CREDITS");
    e.balance = balance;
    e.needed = cost;
    throw e;
  }
  return balance;
}

export async function ledger(panditId, limit = 50) {
  return db.CreditLedger.findAll({
    where: { pandit_id: panditId }, order: [["id", "DESC"]], limit
  });
}
