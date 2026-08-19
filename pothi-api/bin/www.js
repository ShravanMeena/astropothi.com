import config from "../config.js";
import app from "../index.js";
import db from "../database/index.js";

// Dev convenience: sync the schema on boot. Production uses scripts/ensure_*.js.
//
// `alter` is opt-in, not the default, because Sequelize cannot tell an existing
// UNIQUE constraint from one it still needs to create — so every boot adds
// another. Left on, this database accumulated 402 identical unique indexes on
// orders.public_id, each one written on every insert. Run it deliberately after
// changing a model:
//
//     DB_ALTER=1 npm run dev        (then `node scripts/dedupe_constraints.js`)
//
if (config.env !== "production") {
  await db.sequelize.authenticate();
  const alter = process.env.DB_ALTER === "1";
  await db.sequelize.sync({ alter });
  console.log(`[db] synced${alter ? " (altered)" : ""} → ${config.db.name}`);
}

app.listen(config.port, () => console.log(`[pothi-api] :${config.port} (${config.env})`));
