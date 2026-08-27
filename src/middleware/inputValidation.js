const INTEGER_PATTERN = /^[1-9]\d*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEARCH_PATTERN = /^[\p{L}\p{M}\p{N}\s.'-]+$/u;

function sendValidationError(res, message) {
  return res.status(400).json({
    ok: false,
    message,
  });
}

function parsePositiveInteger(value, field) {
  const isString = typeof value === "string";
  const isNumber = typeof value === "number";

  if (!isString && !isNumber) {
    return { error: `${field} debe ser un entero positivo.` };
  }

  const normalized = isString ? value.trim() : String(value);

  if (!INTEGER_PATTERN.test(normalized)) {
    return { error: `${field} debe ser un entero positivo.` };
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    return { error: `${field} supera el valor permitido.` };
  }

  return { value: parsed };
}

function parseUuid(value, field) {
  if (typeof value !== "string") {
    return { error: `${field} debe ser un UUID valido.` };
  }

  const normalized = value.trim();

  if (!UUID_PATTERN.test(normalized)) {
    return { error: `${field} debe ser un UUID valido.` };
  }

  return { value: normalized.toLowerCase() };
}

function validatePositiveIntegerFields(source, fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const result = parsePositiveInteger(req[source]?.[field], field);

      if (result.error) {
        return sendValidationError(res, result.error);
      }

      req[source][field] = result.value;
    }

    return next();
  };
}

function validatePositiveIntegerParams(fields) {
  return validatePositiveIntegerFields("params", fields);
}

function validatePositiveIntegerBody(fields) {
  return validatePositiveIntegerFields("body", fields);
}

function validateUuidFields(source, fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const result = parseUuid(req[source]?.[field], field);

      if (result.error) {
        return sendValidationError(res, result.error);
      }

      req[source][field] = result.value;
    }

    return next();
  };
}

function validateUuidParams(fields) {
  return validateUuidFields("params", fields);
}

function validateUuidBody(fields) {
  return validateUuidFields("body", fields);
}

function validatePaginationQuery({ maxLimit = 100 } = {}) {
  return (req, res, next) => {
    for (const field of ["page", "limit"]) {
      if (req.query[field] === undefined) {
        continue;
      }

      const result = parsePositiveInteger(req.query[field], field);

      if (result.error) {
        return sendValidationError(res, result.error);
      }

      if (field === "limit" && result.value > maxLimit) {
        return sendValidationError(res, `limit no puede ser mayor que ${maxLimit}.`);
      }

      req.query[field] = result.value;
    }

    return next();
  };
}

function validateSearchQuery(field, { maxLength = 80 } = {}) {
  return (req, res, next) => {
    const value = req.query[field];

    if (value === undefined) {
      return next();
    }

    if (Array.isArray(value) || typeof value === "object") {
      return sendValidationError(res, `${field} debe ser texto.`);
    }

    const normalized = String(value).trim();

    if (normalized.length > maxLength) {
      return sendValidationError(res, `${field} no debe superar ${maxLength} caracteres.`);
    }

    if (normalized !== "" && !SEARCH_PATTERN.test(normalized)) {
      return sendValidationError(res, `${field} contiene caracteres no permitidos.`);
    }

    req.query[field] = normalized;
    return next();
  };
}

module.exports = {
  parsePositiveInteger,
  parseUuid,
  validatePositiveIntegerParams,
  validatePositiveIntegerBody,
  validateUuidParams,
  validateUuidBody,
  validatePaginationQuery,
  validateSearchQuery,
};
