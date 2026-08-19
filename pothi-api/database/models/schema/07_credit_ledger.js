// Append-only. Balance is ALWAYS SUM(delta) — there is no mutable balance column
// to drift out of sync.
export default (sequelize, DataTypes) =>
  sequelize.define("CreditLedger", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id: { type: DataTypes.BIGINT, allowNull: false },
    delta:     { type: DataTypes.INTEGER, allowNull: false },
    reason:    { type: DataTypes.ENUM("purchase", "generate", "refund", "bonus", "trial", "expiry", "adjustment"), allowNull: false },
    ref_type:  { type: DataTypes.STRING(32) },
    ref_id:    { type: DataTypes.BIGINT },
    note:      { type: DataTypes.STRING(200) }
  }, { tableName: "credit_ledger", paranoid: false, updatedAt: false,
       indexes: [{ fields: ["pandit_id", "id"] }] });
