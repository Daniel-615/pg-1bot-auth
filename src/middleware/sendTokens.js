const jwt = require("jsonwebtoken");
const { SECRET_JWT_KEY } = require("../config/config.js");
const db = require("../models");
const Rol = db.getModel("Rol");
const Permiso = db.getModel("Permiso");
const cookieOptions = require("./cookieOptions");
const { hashToken } = require("./tokenSecurity");
async function generarTokensYEnviar(usuario, res, rolesNombre) {
  if (!SECRET_JWT_KEY || SECRET_JWT_KEY.length < 32) {
    throw new Error("SECRET_JWT_KEY debe tener al menos 32 caracteres.");
  }

  const roles = await Rol.findAll({
    where: { nombre: rolesNombre },
    include: {
      model: Permiso,
      as: "Permisos",
      attributes: ["nombre"],
      through: { attributes: [] }
    }
  });

  const permisosNombre = [...new Set(roles.flatMap(r => r.Permisos.map(p => p.nombre)))];

  const accessToken = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      edad: usuario.edad,
      rol: rolesNombre,
      permisos: permisosNombre
    },
    SECRET_JWT_KEY,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      edad: usuario.edad,
      rol: rolesNombre,
      permisos: permisosNombre
    },
    SECRET_JWT_KEY,
    { expiresIn: "7d" }
  );

  usuario.refreshToken = hashToken(refreshToken);

  return usuario.save().then(() => {
    res
      .cookie("access_token", accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000,
      })
      .cookie("refresh_token", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    return { accessToken, refreshToken };
  });
}

module.exports = {
  generarTokensYEnviar
};
