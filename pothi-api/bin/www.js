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

app.listen(config.port, async () => {
  console.log(`[pothi-api] :${config.port} (${config.env})`);

  // Warm the storefront's samples in the background, after the port is open.
  //
  // Deliberately not awaited: the server must accept requests immediately, and
  // a cold preview still renders on demand if somebody beats the warmer to it
  // (getPreview dedupes concurrent renders of the same variant). Set
  // WARM_PREVIEWS=0 to skip it — useful when iterating on the renderer, where
  // every restart would otherwise re-render everything the change invalidated.
  if (process.env.WARM_PREVIEWS !== "0") {
    const { warmPreviews } = await import("../server/catalog/preview.service.js");
    warmPreviews().catch((e) => console.warn(`[warm] skipped: ${e.message}`));
  }
});
