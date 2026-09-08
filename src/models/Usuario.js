const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { SALT_ROUNDS } = require('../config/config');

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function safePlainTextCompare(password, storedPassword) {
  const passwordBuffer = Buffer.from(String(password));
  const storedBuffer = Buffer.from(String(storedPassword));

  if (passwordBuffer.length !== storedBuffer.length) return false;

  return crypto.timingSafeEqual(passwordBuffer, storedBuffer);
}

class Usuario extends Model {
  //Getters
  get FullName() {
    return `${this.nombre} ${this.apellido}`;
  }
  get Status() {
    return `${this.status ? 'Activo' : 'Inactivo'}`;
  }
  get Email() {
    return this.email;
  }
  async isValid(password, passwordHash) {
    if (!password || !passwordHash) return false;

    if (isBcryptHash(passwordHash)) {
      return bcrypt.compare(password, passwordHash);
    }

    return safePlainTextCompare(password, passwordHash);
  }
  //Setters
  set Password(newPassword) {
    if (!newPassword) return;
    const hashedPassword = isBcryptHash(newPassword)
      ? newPassword
      : bcrypt.hashSync(newPassword, SALT_ROUNDS);
    this.setDataValue('password', hashedPassword);
  }

  set Email(newEmail) {
    this.email = newEmail;
  }
  set Status(newStatus) {
    this.status = newStatus;
  }
  set Nombre(newNombre) {
    this.nombre = newNombre;
  }
  set Apellido(newApellido) {
    this.apellido = newApellido;
  }


}

module.exports = (sequelize) => {
  Usuario.init(
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false
      },
      apellido: {
        type: DataTypes.STRING
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { isInt: true, min: 5, max: 120 }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [3, 254]
        },
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          if (!value) return;
          const hashedPassword = isBcryptHash(value)
            ? value
            : bcrypt.hashSync(value, SALT_ROUNDS);
          this.setDataValue('password', hashedPassword);
        }
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      verificationCodeHash: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      verificationCodeExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      verificationAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'usuario',
      tableName: 'usuarios',
      timestamps: true
    }
  );

  return Usuario;
};
