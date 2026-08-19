export default (sequelize, DataTypes) =>
  sequelize.define("OtpSession", {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    isd_code: { type: DataTypes.STRING(6), defaultValue: "+91" },
    phone:    { type: DataTypes.STRING(20), allowNull: false },
    otp:      { type: DataTypes.STRING(8), allowNull: false },
    channel:  { type: DataTypes.STRING(20), defaultValue: "WHATSAPP" },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    status:   { type: DataTypes.ENUM("created", "completed", "expired"), defaultValue: "created" },
    expires_at: { type: DataTypes.DATE }
  }, { tableName: "otp_sessions", indexes: [{ fields: ["phone", "status"] }] });
