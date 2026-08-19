import { Sequelize, DataTypes } from "sequelize";
import { readdirSync } from "node:fs";
import path from "node:path";
import config from "../config.js";

export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: "postgres",
  logging: false,
  define: { underscored: false, freezeTableName: true, timestamps: true, paranoid: true }
});

const schemaDir = path.resolve(import.meta.dirname, "models", "schema");
export const db = { sequelize, Sequelize, DataTypes };

for (const file of readdirSync(schemaDir).filter((f) => f.endsWith(".js")).sort()) {
  const { default: define } = await import(path.join(schemaDir, file));
  const model = define(sequelize, DataTypes);
  db[model.name] = model;
}

// Associations, all in one place.
const { Pandit, BrandingProfile, CreditLedger, CreditPurchase, Client, Report, PanditPrice, Order, User, ChatMessage } = db;
Pandit.hasOne(BrandingProfile,  { foreignKey: "pandit_id", as: "branding" });
Pandit.hasMany(CreditLedger,    { foreignKey: "pandit_id" });
Pandit.hasMany(CreditPurchase,  { foreignKey: "pandit_id" });
Pandit.hasMany(Client,          { foreignKey: "pandit_id" });
Pandit.hasMany(Report,          { foreignKey: "pandit_id" });
Pandit.hasMany(PanditPrice,     { foreignKey: "pandit_id" });
BrandingProfile.belongsTo(Pandit, { foreignKey: "pandit_id" });
Report.belongsTo(Pandit,  { foreignKey: "pandit_id" });
Report.belongsTo(Client,  { foreignKey: "client_id" });
Client.belongsTo(Pandit,  { foreignKey: "pandit_id" });
Client.hasMany(Report,    { foreignKey: "client_id" });
User.hasMany(Order,       { foreignKey: "user_id" });
Order.belongsTo(User,     { foreignKey: "user_id" });
Order.hasMany(ChatMessage, { foreignKey: "order_id" });
ChatMessage.belongsTo(Order, { foreignKey: "order_id" });
Order.hasOne(Report,      { foreignKey: "order_id" });
Report.belongsTo(Order,   { foreignKey: "order_id" });

export default db;
