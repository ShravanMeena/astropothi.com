// A consumer buying one report for themselves. No account, no credits.
//
// Deliberately separate from CreditPurchase: a pandit buys a *pack of capacity*,
// a consumer buys *one artefact*. Conflating them would force one of the two
// flows to pretend to be the other.
export default (sequelize, DataTypes) =>
  sequelize.define("Order", {
    id:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    public_id:    { type: DataTypes.STRING(16), unique: true },   // shown to the buyer
    report_type:  { type: DataTypes.STRING(32), allowNull: false },
    design:       { type: DataTypes.STRING(32), defaultValue: "classic" },
    palette:      { type: DataTypes.STRING(32), defaultValue: "saffron" },
    language:     { type: DataTypes.STRING(8),  defaultValue: "hi" },

    // Set once the buyer signs in with their mobile. Orders placed before we
    // knew who they were are claimed by phone on their next sign-in.
    user_id:      { type: DataTypes.BIGINT },

    buyer_name:   { type: DataTypes.STRING(120) },
    buyer_phone:  { type: DataTypes.STRING(20) },
    buyer_email:  { type: DataTypes.STRING(160) },
    state:        { type: DataTypes.STRING(60) },   // GST place of supply

    birth:        { type: DataTypes.JSONB },        // name, dob, tob, pob, lat, lon, tzone, gender

    amount_paise: { type: DataTypes.INTEGER, allowNull: false },
    gst_paise:    { type: DataTypes.INTEGER, defaultValue: 0 },
    razorpay_order_id:   { type: DataTypes.STRING(64), unique: true },
    razorpay_payment_id: { type: DataTypes.STRING(64) },
    // Payment Links flow: we hand the buyer a hosted page rather than opening
    // a checkout SDK, so the link id is what the webhook arrives carrying.
    razorpay_link_id:    { type: DataTypes.STRING(64) },
    razorpay_link_url:   { type: DataTypes.TEXT },
    // created -> paid is driven by the WEBHOOK. Generation happens only after paid.
    status:       { type: DataTypes.ENUM("created", "paid", "generating", "ready", "failed", "refunded"),
                    defaultValue: "created" },
    report_id:    { type: DataTypes.BIGINT },
    invoice_no:   { type: DataTypes.STRING(32) },
    // Set the first time the "your report is ready" WhatsApp goes out. The
    // webhook and the browser callback both settle an order, and either may
    // arrive twice — without this the buyer gets the same message repeatedly.
    whatsapp_sent_at: { type: DataTypes.DATE },
    whatsapp_error:   { type: DataTypes.TEXT },
    error:        { type: DataTypes.TEXT }
  }, { tableName: "orders",
       indexes: [{ fields: ["public_id"], unique: true }, { fields: ["buyer_phone"] },
                 { fields: ["status"] }, { fields: ["user_id"] }, { fields: ["razorpay_link_id"] }] });
