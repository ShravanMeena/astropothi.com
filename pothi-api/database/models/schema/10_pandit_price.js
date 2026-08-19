// His own selling price per report type. Drives "you earned ₹39,600".
export default (sequelize, DataTypes) =>
  sequelize.define("PanditPrice", {
    id:          { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id:   { type: DataTypes.BIGINT, allowNull: false },
    report_type: { type: DataTypes.STRING(32), allowNull: false },
    sale_price_paise: { type: DataTypes.INTEGER, allowNull: false }
  }, { tableName: "pandit_prices",
       indexes: [{ fields: ["pandit_id", "report_type"], unique: true }] });
