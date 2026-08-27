class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

class ValidationUser {
  static userName(username) {
    if (typeof username !== "string" || username.trim() === "") {
      throw new ValidationError("El nombre de usuario es obligatorio y debe ser una cadena de texto.");
    }

    const normalized = username.trim();

    if (normalized.length < 3) {
      throw new ValidationError("El nombre de usuario debe tener al menos 3 caracteres.");
    }

    if (normalized.length > 80) {
      throw new ValidationError("El nombre de usuario no debe superar los 80 caracteres.");
    }

    return normalized;
  }

  static email(email) {
    if (typeof email !== "string") {
      throw new ValidationError("El correo electrónico no es válido.");
    }

    const normalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized) || normalized.length > 254) {
      throw new ValidationError("El correo electrónico no es válido.");
    }

    return normalized;
  }

  static password(password) {
    if (typeof password !== "string" || password.trim() === "") {
      throw new ValidationError("La contraseña es obligatoria y debe ser una cadena de texto.");
    }

    if (password.length < 8) {
      throw new ValidationError("La contraseña debe tener al menos 8 caracteres.");
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      throw new ValidationError("La contraseña debe incluir mayúsculas, minúsculas y números.");
    }

    return password;
  }

  static passwordRequired(password) {
    if (typeof password !== "string" || password === "") {
      throw new ValidationError("La contraseña es obligatoria y debe ser una cadena de texto.");
    }

    return password;
  }

  static loginCredentials({ email, password } = {}) {
    return {
      email: this.email(email),
      password: this.passwordRequired(password),
    };
  }

  static isValidationError(error) {
    return error instanceof ValidationError || error?.name === "ValidationError";
  }
}

ValidationUser.ValidationError = ValidationError;

module.exports = ValidationUser;
