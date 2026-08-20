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
    // Vastu's subject is a building, not a person: { name, facing, rooms{} }.
    // Kept in its own column rather than overloading `birth`, so nothing that
    // reads a chart can ever be handed a floor plan.
    property:     { type: DataTypes.JSONB },
    // A Couples Challenge has neither a birth moment nor a building: two names,
    // an optional start date, and an optional gift message. Its own column for
    // the same reason `property` has one — nothing that reads `birth` should
    // have to learn that some orders keep something else in it.
    couple:       { type: DataTypes.JSONB },

    // What was charged, and what it would have been. Keeping the list price
    // means discount depth is a column, not a join against a coupon that may
    // since have been edited.
    /**
     * Where this order came from.
     *
     * Flat columns for the three fields every report groups by, and the whole
     * record — click ids, term, content, landing page, first AND last touch —
     * in the JSONB beside them. Stored ON THE ORDER at creation rather than
     * joined from app_events later: events are stitched by a browser-local
     * anonymous_id, which a cleared cache or a second device breaks, and the
     * one row that must never lose its attribution is the one with money on it.
     */
    utm_source:   { type: DataTypes.STRING(120) },
    utm_medium:   { type: DataTypes.STRING(120) },
    utm_campaign: { type: DataTypes.STRING(160) },
    attribution:  { type: DataTypes.JSONB },

    list_paise:   { type: DataTypes.INTEGER },
    coupon_code:  { type: DataTypes.STRING(32) },
    discount_paise: { type: DataTypes.INTEGER, defaultValue: 0 },
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
    // How many questions this buyer has asked their report. The assistant is a
    // metered cost behind a public URL, so it is capped per order.
    ai_questions:     { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    error:        { type: DataTypes.TEXT }
  }, { tableName: "orders",
       indexes: [{ fields: ["public_id"], unique: true }, { fields: ["buyer_phone"] },
                 { fields: ["status"] }, { fields: ["user_id"] }, { fields: ["razorpay_link_id"] }] });
