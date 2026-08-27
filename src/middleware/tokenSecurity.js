const crypto = require("crypto");

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function safeCompareToken(token, storedHash) {
  if (!token || !storedHash) return false;

  const currentHash = hashToken(token);
  const current = Buffer.from(currentHash, "hex");
  const stored = Buffer.from(String(storedHash), "hex");

  if (current.length !== stored.length) return false;

  return crypto.timingSafeEqual(current, stored);
}

module.exports = {
  hashToken,
  safeCompareToken
};
