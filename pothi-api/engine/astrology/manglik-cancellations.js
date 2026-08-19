// Manglik Dosha cancellations & mitigators.
//
// The implementation now lives in detect-doshas.js so Manglik has a single
// home — detection and cancellations are evaluated together there. This module
// is kept as a stable import path for the AI prompt (inhouse_dosh.service.js)
// and the engine barrel (engine/index.js); both re-export the same function.
export { analyzeManglikCancellations } from "./detect-doshas.js";
