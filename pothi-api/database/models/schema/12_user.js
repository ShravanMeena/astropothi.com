// A consumer account, identified by mobile number.
//
// Deliberately separate from Pandit: a pandit is a business with branding,
// credits and clients; a buyer is a person with orders and, if they choose to
// tell us, an inner life. Nothing here beyond the phone is required.
export default (sequelize, DataTypes) =>
  sequelize.define("User", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    isd_code:  { type: DataTypes.STRING(6), defaultValue: "+91" },
    phone:     { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name:      { type: DataTypes.STRING(120) },
    email:     { type: DataTypes.STRING(160) },

    // Remembered from the last order so a returning buyer never retypes their
    // birth details — the one thing this form gets wrong most often.
    birth:     { type: DataTypes.JSONB },

    // Everything the buyer volunteers: what they follow, what they are asking
    // about, an ishta devta, notes. Optional by design — we ask, never require.
    profile:   { type: DataTypes.JSONB, defaultValue: {} },

    // When this account last proved it owns the number by entering an OTP.
    // Null means every session it has ever had came from checkout auto-login.
    verified_at: { type: DataTypes.DATE },

    status:    { type: DataTypes.ENUM("active", "suspended"), defaultValue: "active" },
    last_seen_at: { type: DataTypes.DATE },

    /**
     * The click that first brought this person to us, kept for the life of the
     * account. An order records both first and last touch; this records only
     * first, because the question a customer row answers is "which campaign
     * acquired them", not "what did they click last week".
     */
    first_utm_source:   { type: DataTypes.STRING(120) },
    first_utm_campaign: { type: DataTypes.STRING(160) },
    attribution:        { type: DataTypes.JSONB }
  }, { tableName: "users", indexes: [{ fields: ["phone"], unique: true }] });
