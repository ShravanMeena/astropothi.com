export default (sequelize, DataTypes) =>
  sequelize.define("CreditPack", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    code:        { type: DataTypes.STRING(32), unique: true, allowNull: false },
    name_en:     { type: DataTypes.STRING(80) },
    name_hi:     { type: DataTypes.STRING(80) },
    // Inclusive of GST — what the pandit actually pays. Never quote ex-GST.
    price_paise: { type: DataTypes.INTEGER, allowNull: false },
    credits:     { type: DataTypes.INTEGER, allowNull: false },
    validity_days: { type: DataTypes.INTEGER, defaultValue: 365 },
    sort_order:  { type: DataTypes.INTEGER, defaultValue: 0 },
    highlight:   { type: DataTypes.BOOLEAN, defaultValue: false },
    active:      { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: "credit_packs" });
