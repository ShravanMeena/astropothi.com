// The pandit's own customer. His digital vahi.
export default (sequelize, DataTypes) =>
  sequelize.define("Client", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    pandit_id: { type: DataTypes.BIGINT, allowNull: false },
    name:      { type: DataTypes.STRING(120), allowNull: false },
    gender:    { type: DataTypes.ENUM("male", "female", "other"), defaultValue: "male" },
    dob:       { type: DataTypes.STRING(10) },
    tob:       { type: DataTypes.STRING(8) },
    tob_unknown: { type: DataTypes.BOOLEAN, defaultValue: false },
    pob:       { type: DataTypes.STRING(200) },
    lat:       { type: DataTypes.DOUBLE },
    lon:       { type: DataTypes.DOUBLE },
    tzone:     { type: DataTypes.DOUBLE, defaultValue: 5.5 },
    phone:     { type: DataTypes.STRING(20) },
    notes:     { type: DataTypes.TEXT }
  }, { tableName: "clients", indexes: [{ fields: ["pandit_id"] }, { fields: ["pandit_id", "phone"] }] });
