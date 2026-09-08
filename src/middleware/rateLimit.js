function rateLimiter({ windowMs = 60 * 1000, max = 120, maxEntries = 10_000, keyGenerator } = {}) {
  const attempts = new Map();
  const getKey = keyGenerator || ((req) => req.ip);

  // Evita que un atacante pueda hacer crecer el mapa indefinidamente.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  cleanup.unref?.();

  return (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const now = Date.now();
    const key = getKey(req);
    const entry = attempts.get(key);

    if (!entry || entry.resetAt <= now) {
      if (attempts.size >= maxEntries) {
        // Las entradas se limpian por tiempo; este tope protege memoria mientras tanto.
        attempts.delete(attempts.keys().next().value);
      }
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      res.set("RateLimit-Limit", String(max));
      return next();
    }

    entry.count += 1;
    res.set("RateLimit-Limit", String(max));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", retryAfter);
      res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
      return res.status(429).json({
        ok: false,
        message: "Demasiados intentos. Intenta nuevamente más tarde."
      });
    }

    return next();
  };
}

function authRateLimiter(options = {}) {
  return rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    ...options,
    keyGenerator: (req) => `${req.ip}:${req.path}`,
  });
}

module.exports = {
  rateLimiter,
  authRateLimiter
};
