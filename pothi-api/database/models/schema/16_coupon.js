// A discount code.
//
// Redemption is counted on the ORDER, not here, so a coupon that is applied but
// never paid for does not burn a use — the count is incremented at settlement.
export default (sequelize, DataTypes) =>
  sequelize.define("Coupon", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    code:        { type: DataTypes.STRING(32), allowNull: false, unique: true },  // stored uppercase
    kind:        { type: DataTypes.ENUM("percent", "flat"), allowNull: false },
    value:       { type: DataTypes.INTEGER, allowNull: false },  // percent 1–100, or paise off
    // Guard rails, all optional.
    max_discount_paise: { type: DataTypes.INTEGER },   // caps a percent coupon
    min_amount_paise:   { type: DataTypes.INTEGER },
    report_types:{ type: DataTypes.JSONB },            // null = every report
    max_uses:    { type: DataTypes.INTEGER },          // null = unlimited
    uses:        { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    starts_at:   { type: DataTypes.DATE },
    expires_at:  { type: DataTypes.DATE },
    active:      { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    note:        { type: DataTypes.STRING(200) }
  }, { tableName: "coupons", indexes: [{ fields: ["code"], unique: true }] });
