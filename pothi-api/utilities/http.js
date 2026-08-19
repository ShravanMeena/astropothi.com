export const ok = (res, results, status = 200) => res.status(status).json({ success: true, results });
export const fail = (res, message, status = 400, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

// Wrap an async handler so a throw becomes a 500 instead of an unhandled rejection.
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
