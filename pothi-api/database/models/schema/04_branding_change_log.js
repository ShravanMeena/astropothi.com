// Append-only. Feeds the >2-identity arbitrage alert.
export default (sequelize, DataTypes) =>
  sequelize.define("BrandingChangeLog", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id: { type: DataTypes.BIGINT, allowNull: false },
    changed_fields: { type: DataTypes.JSONB },
    before:    { type: DataTypes.JSONB },
    after:     { type: DataTypes.JSONB },
    ip:        { type: DataTypes.STRING(64) },
    ua:        { type: DataTypes.TEXT }
  }, { tableName: "branding_change_log", paranoid: false, updatedAt: false,
       indexes: [{ fields: ["pandit_id"] }] });
