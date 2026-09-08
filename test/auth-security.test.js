const assert = require("node:assert/strict");
const test = require("node:test");

const ValidationUser = require("../src/middleware/validationUser.js");
const { hashToken, safeCompareToken } = require("../src/middleware/tokenSecurity.js");

test("normaliza emails antes de usarlos", () => {
  assert.equal(ValidationUser.email("  USER@Example.COM "), "user@example.com");
});

test("rechaza contraseñas débiles para registro y reset", () => {
  assert.throws(() => ValidationUser.password("secret"), /al menos 8 caracteres/);
  assert.throws(() => ValidationUser.password("secret123"), /mayúsculas/);
});

test("acepta contraseñas fuertes", () => {
  assert.equal(ValidationUser.password("Secret123"), "Secret123");
});

test("valida la edad del usuario", () => {
  assert.equal(ValidationUser.age("12"), 12);
  assert.throws(() => ValidationUser.age(4), /entre 5 y 120/);
  assert.throws(() => ValidationUser.age("12.5"), /entre 5 y 120/);
});

test("valida credenciales de login sin reglas de registro", () => {
  const credentials = ValidationUser.loginCredentials({
    email: "  USER@Example.COM ",
    password: "secret",
  });

  assert.deepEqual(credentials, {
    email: "user@example.com",
    password: "secret",
  });
});

test("identifica errores de validacion para respuestas controladas", () => {
  let error;

  try {
    ValidationUser.loginCredentials({ email: "no-es-email", password: "secret" });
  } catch (err) {
    error = err;
  }

  assert.equal(ValidationUser.isValidationError(error), true);
  assert.equal(error.statusCode, 400);
});

test("hashea tokens y compara sin guardar el valor original", () => {
  const token = "refresh-token-de-prueba";
  const hashed = hashToken(token);

  assert.notEqual(hashed, token);
  assert.equal(safeCompareToken(token, hashed), true);
  assert.equal(safeCompareToken("otro-token", hashed), false);
});
