import config from "../config.js";
import app from "../index.js";
import db from "../database/index.js";

// Dev convenience: sync the schema on boot. Production uses scripts/ensure_*.js.
if (config.env !== "production") {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ alter: true });
  console.log(`[db] synced → ${config.db.name}`);
}

app.listen(config.port, () => console.log(`[pothi-api] :${config.port} (${config.env})`));
