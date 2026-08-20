// Whether a report is on sale, set from the admin panel.
//
// The mirror of PriceOverride, and deliberately the same shape: catalog.js keeps
// `ready` as the default and the source of truth for what EXISTS, and this table
// is how a report is pulled from the shelf at 11pm without a deploy — or put
// back by deleting the row.
//
// Taking a report off sale is a decision with money attached (a live storefront
// stops offering it), so the note and who set it are recorded, exactly as they
// are for a price change.
export default (sequelize, DataTypes) =>
  sequelize.define("ReportStatus", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    report_type: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    // NULL is impossible here: a row exists only to say something the catalogue
    // does not already say, and the only thing it can say is on or off.
    sellable:    { type: DataTypes.BOOLEAN, allowNull: false },
    note:        { type: DataTypes.STRING(200) },
    set_by:      { type: DataTypes.STRING(120) }
  }, { tableName: "report_status", indexes: [{ fields: ["report_type"], unique: true }] });
