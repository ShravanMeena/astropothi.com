export default (sequelize, DataTypes) =>
  sequelize.define("CreditPurchase", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id:   { type: DataTypes.BIGINT, allowNull: false },
    pack_id:     { type: DataTypes.BIGINT },
    amount_paise:{ type: DataTypes.INTEGER, allowNull: false },
    gst_paise:   { type: DataTypes.INTEGER, defaultValue: 0 },
    credits:     { type: DataTypes.INTEGER, allowNull: false },
    razorpay_order_id:   { type: DataTypes.STRING(64), unique: true },
    razorpay_payment_id: { type: DataTypes.STRING(64) },
    // created -> paid is driven by the WEBHOOK, never by the client alone.
    status:      { type: DataTypes.ENUM("created", "paid", "failed"), defaultValue: "created" },
    invoice_no:  { type: DataTypes.STRING(32) },
    expires_at:  { type: DataTypes.DATE }
  }, { tableName: "credit_purchases", indexes: [{ fields: ["pandit_id"] }] });
