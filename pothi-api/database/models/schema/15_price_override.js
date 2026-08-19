// A price set from the admin panel, overriding the tier in catalog.js.
//
// The catalogue stays the default and the source of the tier structure; this
// table is how a price is changed at 11pm without a deploy, and how a test can
// be reverted by deleting a row rather than editing code.
export default (sequelize, DataTypes) =>
  sequelize.define("PriceOverride", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    report_type: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    price_paise: { type: DataTypes.INTEGER, allowNull: false },
    note:        { type: DataTypes.STRING(200) },   // why it was changed
    set_by:      { type: DataTypes.STRING(120) }
  }, { tableName: "price_overrides", indexes: [{ fields: ["report_type"], unique: true }] });
