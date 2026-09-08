const assert = require("node:assert/strict");
const test = require("node:test");

const { rateLimiter } = require("../src/middleware/rateLimit.js");

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    set(name, value) {
      this.headers[name] = String(value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("rechaza solicitudes después del límite y comunica cuándo reintentar", () => {
  const limiter = rateLimiter({ windowMs: 60_000, max: 2 });
  const request = { ip: "203.0.113.10", method: "GET" };

  const first = responseMock();
  let nextCalls = 0;
  limiter(request, first, () => { nextCalls += 1; });
  limiter(request, responseMock(), () => { nextCalls += 1; });

  const blocked = responseMock();
  limiter(request, blocked, () => { nextCalls += 1; });

  assert.equal(nextCalls, 2);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers["Retry-After"], "60");
  assert.equal(blocked.body.ok, false);
});

test("no limita solicitudes OPTIONS", () => {
  const limiter = rateLimiter({ max: 0 });
  const response = responseMock();
  let nextCalled = false;

  limiter({ ip: "203.0.113.11", method: "OPTIONS" }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
});
