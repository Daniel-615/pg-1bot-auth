const db = require("../models");
const RolPermiso = db.getModel("RolPermiso");
const Rol = db.getModel("Rol");
const Permiso = db.getModel("Permiso");
const { Op } = require("sequelize");

class RolPermisoController {

  async permisosNoAsignados(req, res) {
    const { rolId } = req.params;

    if (!rolId) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "rolId es requerido."
        });
    }

    try {
      const asignados = await RolPermiso.findAll({
        where: { rolId },
        attributes: ['permisoId']
      });

      const idsAsignados = asignados.map(rp => rp.permisoId);

      const noAsignados = await Permiso.findAll({
        where: {
          id: {
            [Op.notIn]: idsAsignados.length > 0 ? idsAsignados : [0]
          }
        },
        attributes: ['id', 'nombre']
      });

      return res
        .status(200)
        .json(
          {
            ok: true,
            message: "Roles permisos obtenidos correctamente",
            data: noAsignados
          });
    } catch (err) {
      console.error("Error en permisosNoAsignados:", err);
      return res
        .status(500)
        .json(
          {
            ok: false,
            message: "Error al obtener permisos no asignados",
          });
    }
  }
  async create(req, res) {
    const {
      rolId,
      permisoId
    } = req.body;

    if (!rolId || !permisoId) {
      return res
        .status(400)
        .json(
          {
            ok: false,
            message: "rolId y permisoId son obligatorios."
          });
    }

    try {
      const existing = await RolPermiso.findOne({ where: { rolId, permisoId } });
      if (existing) {
        return res
          .status(400)
          .json(
            {
              ok: false,
              message: "La relación rol-permiso ya existe."
            });
      }
      const nuevaRelacion = await RolPermiso.create({ rolId, permisoId });
      if (!nuevaRelacion) {
        return res
          .status(500)
          .json({
            ok: false,
            message: "No se pudo crear la relación rol-permiso"
          })
      }
      return res
        .status(201)
        .json({
          ok: true,
          message: "Relación rol-permiso creada exitosamente.",
          data: nuevaRelacion
        });
    } catch (err) {
      console.error("Error en create:", err);
      return res
        .status(500)
        .json(
          {
            ok: false,
            message: "Error al crear la relación rol-permiso."
          });
    }
  }

  async findAll(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await RolPermiso.findAndCountAll({
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre'],
            required: true
          },
          {
            model: Permiso,
            as: 'permiso',
            attributes: ['id', 'nombre'],
            required: true
          }
        ],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      return res
        .status(200)
        .json({
          ok: true,
          message: "Rol-Permiso encontrados correctamente",
          data: rows,
          total: count,
          page,
          totalPages
        });
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al obtener las relaciones rol-permiso.",
        });
    }
  }


  async findOne(req, res) {
    const {
      rolId,
      permisoId
    } = req.params;

    if (!rolId || !permisoId) {
      return res
        .status(400)
        .json(
          {
            ok: false,
            message: "rolId y permisoId son requeridos como parámetros."
          });
    }

    try {
      const relacion = await RolPermiso.findOne({
        where: { rolId, permisoId },
        include: [
          { model: Rol, as: 'rol', attributes: ["id", "nombre"] },
          { model: Permiso, as: 'permiso', attributes: ["id", "nombre"] }
        ]
      });

      if (!relacion) {
        return res
          .status(404)
          .json(
            {
              ok: false,
              message: "Relación rol-permiso no encontrada."
            });
      }
      return res
        .status(200)
        .json({
          ok: true,
          message: "Rol-permiso obtenido correctamente",
          data: relacion
        });
    } catch (err) {
      return res
        .status(500)
        .json(
          {
            ok: false,
            message: "Error al obtener la relación"
          });
    }
  }

  async delete(req, res) {
    const { rolId, permisoId } = req.params;

    if (!rolId || !permisoId) {
      return res.status(400).json({ message: "rolId y permisoId son requeridos como parámetros." });
    }

    try {
      const deleted = await RolPermiso.destroy({ where: { rolId, permisoId } });

      if (deleted === 1) {
        return res
          .status(200)
          .json(
            {
              ok: true,
              message: "Relación eliminada exitosamente."
            });
      } else {
        return res
          .status(404)
          .json(
            {
              ok: false,
              message: "Relación no encontrada."
            });
      }
    } catch (err) {
      return res
        .status(500)
        .json(
          {
            ok: false,
            message: "Error al eliminar la relación"
          });
    }
  }
}

module.exports = RolPermisoController;
