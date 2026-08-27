const assert = require("node:assert/strict");
const test = require("node:test");

const {
  validatePaginationQuery,
  validatePositiveIntegerBody,
  validatePositiveIntegerParams,
  validateSearchQuery,
  validateUuidBody,
  validateUuidParams,
} = require("../src/middleware/inputValidation.js");

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function runMiddleware(middleware, req) {
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { res, nextCalled };
}

test("rechaza parametros de ruta que no son enteros positivos", () => {
  const { res, nextCalled } = runMiddleware(
    validatePositiveIntegerParams(["id"]),
    { params: { id: "1 OR 1=1" } }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /entero positivo/);
});

test("normaliza ids validos de params y body a numeros", () => {
  const reqParams = { params: { id: "42" } };
  const paramsResult = runMiddleware(validatePositiveIntegerParams(["id"]), reqParams);

  assert.equal(paramsResult.nextCalled, true);
  assert.equal(reqParams.params.id, 42);

  const reqBody = { body: { usuarioId: "7", rolId: 3 } };
  const bodyResult = runMiddleware(validatePositiveIntegerBody(["usuarioId", "rolId"]), reqBody);

  assert.equal(bodyResult.nextCalled, true);
  assert.equal(reqBody.body.usuarioId, 7);
  assert.equal(reqBody.body.rolId, 3);
});

test("rechaza uuids invalidos en params", () => {
  const { res, nextCalled } = runMiddleware(
    validateUuidParams(["id"]),
    { params: { id: "1 OR 1=1" } }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /UUID valido/);
});

test("normaliza uuids validos de params y body", () => {
  const reqParams = { params: { id: "550E8400-E29B-41D4-A716-446655440000" } };
  const paramsResult = runMiddleware(validateUuidParams(["id"]), reqParams);

  assert.equal(paramsResult.nextCalled, true);
  assert.equal(reqParams.params.id, "550e8400-e29b-41d4-a716-446655440000");

  const reqBody = { body: { usuarioId: "550E8400-E29B-41D4-A716-446655440001" } };
  const bodyResult = runMiddleware(validateUuidBody(["usuarioId"]), reqBody);

  assert.equal(bodyResult.nextCalled, true);
  assert.equal(reqBody.body.usuarioId, "550e8400-e29b-41d4-a716-446655440001");
});

test("valida paginacion y limita el tamano de limit", () => {
  const invalidResult = runMiddleware(
    validatePaginationQuery({ maxLimit: 100 }),
    { query: { page: "1", limit: "1000" } }
  );

  assert.equal(invalidResult.nextCalled, false);
  assert.equal(invalidResult.res.statusCode, 400);
  assert.match(invalidResult.res.body.message, /limit/);

  const req = { query: { page: "2", limit: "20" } };
  const validResult = runMiddleware(validatePaginationQuery(), req);

  assert.equal(validResult.nextCalled, true);
  assert.equal(req.query.page, 2);
  assert.equal(req.query.limit, 20);
});

test("rechaza busquedas con caracteres de inyeccion", () => {
  const { res, nextCalled } = runMiddleware(
    validateSearchQuery("nombre"),
    { query: { nombre: "admin'; DROP TABLE usuarios; --" } }
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /caracteres no permitidos/);
});
