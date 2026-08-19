// One turn of a buyer talking to their report.
//
// Kept as rows rather than a JSONB blob on the order, because the point of
// storing them is to read across them later: what people actually ask, which
// questions the assistant answers badly, which reports leave readers confused.
// That is a query, and a blob makes it a script.
export default (sequelize, DataTypes) =>
  sequelize.define("ChatMessage", {
    id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    order_id:  { type: DataTypes.BIGINT, allowNull: false },
    // Denormalised on purpose: every lookup is by the id in the URL, and the
    // alternative is a join on every message of every conversation.
    public_id: { type: DataTypes.STRING(16), allowNull: false },

    role:      { type: DataTypes.ENUM("user", "assistant"), allowNull: false },
    content:   { type: DataTypes.TEXT, allowNull: false },

    // How the reply was produced, so a bad answer can be traced to a cause.
    kind:      { type: DataTypes.STRING(24) },   // answer | passages | definition | none | limit
    degraded:  { type: DataTypes.BOOLEAN, defaultValue: false },  // model unavailable → quoted instead
    model:     { type: DataTypes.STRING(160) },
    sources:   { type: DataTypes.JSONB },        // [{ n, title }] the answer was built from
    latency_ms:{ type: DataTypes.INTEGER },
    lang:      { type: DataTypes.STRING(8) }
  }, {
    tableName: "chat_messages",
    indexes: [{ fields: ["public_id", "id"] }, { fields: ["order_id"] }, { fields: ["createdAt"] }]
  });
