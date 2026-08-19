export default (sequelize, DataTypes) =>
  sequelize.define("Report", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    // Nullable: a consumer report has no pandit. Exactly one of pandit_id /
    // order_id is set, enforced in the service layer.
    pandit_id:   { type: DataTypes.BIGINT },
    order_id:    { type: DataTypes.BIGINT },
    source:      { type: DataTypes.ENUM("pandit", "consumer"), defaultValue: "pandit" },
    client_id:   { type: DataTypes.BIGINT },
    report_type: { type: DataTypes.STRING(32), allowNull: false },
    design:      { type: DataTypes.STRING(32), defaultValue: "classic" },
    palette:     { type: DataTypes.STRING(32), defaultValue: "saffron" },
    language:    { type: DataTypes.STRING(8), defaultValue: "hi" },
    status:      { type: DataTypes.ENUM("generating", "ready", "failed"), defaultValue: "generating" },
    pdf_url:     { type: DataTypes.TEXT },
    page_count:  { type: DataTypes.INTEGER },
    credits_charged: { type: DataTypes.INTEGER, defaultValue: 0 },
    report_json: { type: DataTypes.JSONB },
    birth_meta:  { type: DataTypes.JSONB },
    rashi:       { type: DataTypes.STRING(40) },
    nakshatra:   { type: DataTypes.STRING(40) },
    lagna:       { type: DataTypes.STRING(40) },
    share_token: { type: DataTypes.STRING(16), unique: true },
    shared_at:   { type: DataTypes.DATE },
    // What HE sold it for — powers the earnings dashboard.
    sale_price_paise: { type: DataTypes.INTEGER },
    error:       { type: DataTypes.TEXT },
    generated_ms:{ type: DataTypes.INTEGER }
  }, { tableName: "reports",
       indexes: [{ fields: ["pandit_id", "createdAt"] }, { fields: ["share_token"], unique: true }] });
