function requestLogger(req, res, next) {
  const startedAt = Date.now();
  const originalEnd = res.end;

  res.end = function loggedEnd(...args) {
    const duration = Date.now() - startedAt;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) ip=${req.ip}`);
    return originalEnd.apply(this, args);
  };

  next();
}

module.exports = requestLogger;
