// Every meaningful thing a visitor does, before and after they identify.
//
// The hard requirement this is built around: somebody browses for ten minutes,
// buys, and only then gives us a phone number — and we still need the whole
// journey as one story. So every event carries an `anonymous_id` that is minted
// on first visit and never changes, and identity is attached later by writing
// `user_id` onto the rows that anonymous_id already produced.
export default (sequelize, DataTypes) =>
  sequelize.define("AppEvent", {
    id:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },

    name:         { type: DataTypes.STRING(64), allowNull: false },   // page_view, report_viewed, …
    // Coarse bucket so a funnel can be drawn without listing every event name.
    category:     { type: DataTypes.STRING(24) },                     // browse | checkout | report | account | chat

    // The device, for the life of the browser. Survives login and logout.
    anonymous_id: { type: DataTypes.STRING(40), allowNull: false },
    // One visit. Resets after a period of inactivity, so "how many sessions
    // before they bought" is answerable.
    session_id:   { type: DataTypes.STRING(40) },

    // Filled in when we learn who this is — including backwards, onto the rows
    // written before they told us.
    user_id:      { type: DataTypes.BIGINT },
    order_id:     { type: DataTypes.BIGINT },

    path:         { type: DataTypes.STRING(300) },
    referrer:     { type: DataTypes.STRING(300) },
    // utm_source / medium / campaign, kept out of properties so ad spend can be
    // grouped without digging into JSON.
    source:       { type: DataTypes.STRING(80) },
    medium:       { type: DataTypes.STRING(80) },
    campaign:     { type: DataTypes.STRING(120) },

    properties:   { type: DataTypes.JSONB },     // report code, price, design, button label…
    ua:           { type: DataTypes.STRING(300) },
    ip:           { type: DataTypes.STRING(64) },
    // Sent by the browser: the clock we care about is the visitor's, and events
    // arrive batched and out of order.
    occurred_at:  { type: DataTypes.DATE }
  }, {
    tableName: "app_events",
    // Behavioural rows are never edited or soft-deleted; they are appended and
    // aggregated. Paranoid would put a deletedAt filter on every funnel query.
    paranoid: false,
    indexes: [
      { fields: ["name", "occurred_at"] },
      { fields: ["anonymous_id", "id"] },
      { fields: ["session_id"] },
      { fields: ["user_id"] },
      { fields: ["occurred_at"] }
    ]
  });
