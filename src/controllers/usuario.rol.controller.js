const db = require("../models");
const UsuarioRol = db.getModel("UsuarioRol");
const Usuario = db.getModel("Usuario");
const Rol = db.getModel("Rol");
class UsuarioRolController {
    async create(req, res) {
        const {
            usuarioId,
            rolId
        } = req.body;
        if (!usuarioId || !rolId) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "usuarioId y rolId son obligatorios."
                });
        }

        try {
            const existente = await UsuarioRol.findOne({ where: { usuarioId, rolId } });

            if (existente) {
                return res
                    .status(409)
                    .json(
                        {
                            ok: false,
                            message: "La relación usuario-rol ya existe."
                        });
            }
            const nuevaRelacion = await UsuarioRol.create({ usuarioId, rolId });
            if (!nuevaRelacion) {
                return res
                    .status(500)
                    .json({
                        ok: false,
                        message: "No se pudo crear la relación"
                    })
            }
            return res
                .status(201)
                .json({
                    ok: true,
                    message: "Relación usuario-rol creada exitosamente.",
                    data: nuevaRelacion
                });
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al crear la relación usuario-rol.",
                });
        }
    }

    async findAll(req, res) {
        try {
            const relaciones = await UsuarioRol.findAll({
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'nombre', 'email']
                    },
                    {
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'nombre']
                    }
                ]
            });
            return res
                .status(200)
                .json({
                    ok: true,
                    message: "Usuario rol encontrados",
                    data: relaciones
                });
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al obtener las relaciones usuario-rol.",
                });
        }
    }

    async findOne(req, res) {
        const {
            usuarioId,
            rolId
        } = req.params;

        if (!usuarioId || !rolId) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "usuarioId y rolId son requeridos como parámetros."
                });
        }

        try {
            const relacion = await UsuarioRol.findOne({ where: { usuarioId, rolId } });
            if (!relacion) {
                return res
                    .status(404)
                    .json(
                        {
                            ok: false,
                            message: "Relación usuario-rol no encontrada."
                        });
            }

            return res
                .status(200)
                .json({
                    ok: true,
                    message: "Usuario rol encontrado",
                    data: relacion
                });
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al obtener la relación.",
                });
        }
    }

    async delete(req, res) {
        const {
            usuarioId,
            rolId
        } = req.params;

        if (!usuarioId || !rolId) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "usuarioId y rolId son requeridos como parámetros."
                });
        }

        try {
            const deleted = await UsuarioRol.destroy({ where: { usuarioId, rolId } });

            if (deleted === 1) {
                return res
                    .status(200)
                    .json({
                        ok: true,
                        message: "Relación eliminada exitosamente."
                    });
            } else {
                return res
                    .status(404)
                    .json({
                        ok: false,
                        message: "Relación no encontrada."
                    });
            }
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al eliminar la relación.",
                });
        }
    }
}
module.exports = UsuarioRolController;