const db = require("../models");

function checkPermisosDesdeRoles(permisosRequeridos = []) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ ok: false, message: "No autenticado." });
      }

      const usuario = await db.getModel("Usuario").findByPk(req.user.id, {
        include: {
          model: db.getModel("Rol"),
          as: "roles",
          include: {
            model: db.getModel("Permiso"),
            as: "Permisos"
          }
        }
      });

      if (!usuario) {
        return res
          .status(404)
          .json({ ok: false, message: "Usuario no encontrado." });
      }

      const permisosDelUsuario = usuario.roles.flatMap(rol =>
        rol.Permisos.map(p => p.nombre)
      );


      const tienePermiso = permisosRequeridos.every(p =>
        permisosDelUsuario.includes(p)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          ok: false,
          message: "Acceso denegado: no tienes los permisos requeridos.",
          permisosDelUsuario,
          permisosRequeridos
        });
      }

      next();
    } catch (err) {
      console.error("Error en middleware de permisos:", err.message);
      return res
        .status(500)
        .json({ ok: false, message: "Error interno al verificar permisos." });
    }
  };
}

module.exports = {
  checkPermisosDesdeRoles
};
