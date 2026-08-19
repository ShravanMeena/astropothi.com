// The white label. One per pandit. Everything here lands on the PDF.
export default (sequelize, DataTypes) =>
  sequelize.define("BrandingProfile", {
    id:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id:  { type: DataTypes.BIGINT, allowNull: false, unique: true },
    honorific:  { type: DataTypes.STRING(40), defaultValue: "Pt." },
    display_name: { type: DataTypes.STRING(120) },
    shop_name:  { type: DataTypes.STRING(160) },
    phone:      { type: DataTypes.STRING(20) },
    whatsapp:   { type: DataTypes.STRING(20) },
    email:      { type: DataTypes.STRING(160) },
    address:    { type: DataTypes.TEXT },
    logo_url:   { type: DataTypes.TEXT },
    photo_url:  { type: DataTypes.TEXT },
    signature_url: { type: DataTypes.TEXT },
    tagline:    { type: DataTypes.STRING(200) },
    chart_style: { type: DataTypes.ENUM("NORTH_INDIAN", "SOUTH_INDIAN", "EAST_INDIAN"), defaultValue: "NORTH_INDIAN" },
    default_language: { type: DataTypes.STRING(8), defaultValue: "hi" },
    default_design:   { type: DataTypes.STRING(32), defaultValue: "classic" },
    default_palette:  { type: DataTypes.STRING(32), defaultValue: "saffron" },
    ui_language:      { type: DataTypes.STRING(8), defaultValue: "en" },
    // Anti-arbitrage: a reseller must emit under many identities. Cap and count.
    changes_this_quarter: { type: DataTypes.INTEGER, defaultValue: 0 },
    quarter_started_at:   { type: DataTypes.DATE }
  }, { tableName: "branding_profiles" });
