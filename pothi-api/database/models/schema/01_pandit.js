// The customer: an astrologer / pandit / shop who buys credits.
export default (sequelize, DataTypes) =>
  sequelize.define("Pandit", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    isd_code:  { type: DataTypes.STRING(6), defaultValue: "+91" },
    phone:     { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name:      { type: DataTypes.STRING(120) },
    email:     { type: DataTypes.STRING(160) },
    city:      { type: DataTypes.STRING(120) },
    // Mandatory for GST place-of-supply. Defaults to our own state if absent,
    // which is the wrong answer — so the UI must force a choice.
    state:     { type: DataTypes.STRING(60) },
    gstin:     { type: DataTypes.STRING(20) },
    business_name: { type: DataTypes.STRING(160) },
    status:    { type: DataTypes.ENUM("active", "suspended"), defaultValue: "active" },
    referred_by: { type: DataTypes.BIGINT },
    trial_granted_at: { type: DataTypes.DATE },
    invite_code:  { type: DataTypes.STRING(32) },
    pilot_seat:   { type: DataTypes.INTEGER },   // 1..PILOT_SEATS, null once pilot ends
    // Staff. Set by scripts/seed_admin.js only — deliberately not settable
    // through any route, because every route that writes a pandit row would
    // otherwise become a route that can promote one.
    is_admin:     { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    last_seen_at: { type: DataTypes.DATE }
  }, { tableName: "pandits", indexes: [{ fields: ["phone"], unique: true }] });
