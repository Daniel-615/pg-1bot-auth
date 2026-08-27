const db = require("../models")
const Permiso = db.getModel("Permiso")

class PermisoController {
    async create(req, res) {
        const { nombre } = req.body
        if (!nombre) {
            return res
                .status(400)
                .json(
                    {
                        ok: false,
                        message: "El nombre del permiso es obligatorio."
                    })
        }
        try {
            const existing = await Permiso.findOne(
                { where: { nombre } }
            )
            if (existing) {
                return res
                    .status(400)
                    .json(
                        {
                            ok: false,
                            message: "El permiso ya existe."
                        })
            }
            const newPermiso = await Permiso.create(
                {
                    nombre
                }
            )
            if (!newPermiso) {
                return res
                    .status(500)
                    .json({
                        ok: false,
                        message: "No se pudo crear el permiso"
                    })
            }
            return res
                .status(201)
                .json({
                    ok: true,
                    message: "Permiso creado exitosamente.",
                    permiso: {
                        id: newPermiso.id,
                        nombre: newPermiso.nombre
                    }
                });
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al verificar el permiso."
                })
        }
    }
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await Permiso.findAndCountAll({
                limit,
                offset,
                order: [['id', 'ASC']],
            });
            if (!rows) {
                return res
                    .status(404)
                    .json({
                        ok: false,
                        message: "No se encontraron permisos"
                    })
            }
            return res
                .status(200)
                .json({
                    ok: true,
                    data: {
                        rows: rows,
                        total: count,
                        page: page,
                        totalPages: Math.ceil(count / limit),
                    }
                });
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al obtener los permisos."
                });
        }
    }

    async findOne(req, res) {
        const { id } = req.params;
        if (!id) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "Falta 'id' en la url"
                })
        }
        try {
            const permiso = await Permiso.findByPk(id);
            if (!permiso) {
                return res
                    .status(404)
                    .json({
                        ok: false,
                        message: "Permiso no encontrado."
                    })
            }
            return res
                .status(200)
                .json({
                    ok: true,
                    message: "Permisos encontrados exitosamente",
                    data: permiso
                })
        } catch (err) {
            return res
                .status(500)
                .json(
                    {
                        ok: false,
                        message: "Error al obtener el permiso"
                    })
        }
    }
    async update(req, res) {
        const { id } = req.params;
        const { nombre } = req.body
        if (!id) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "Falta 'id' en la url"
                })
        }
        if (!nombre) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "El nombre es obligatorio"
                })
        }
        try {
            const permiso = await Permiso.findByPk(id)
            if (!permiso) {
                return res
                    .status(404)
                    .json(
                        {
                            ok: false,
                            message: "Permiso no encontrado."
                        })
            }
            permiso.nombre = nombre
            await permiso.save()
            return res
                .status(200)
                .json({
                    ok: true,
                    message: "Permiso actualizado exitosamente.",
                    permiso: {
                        id: permiso.id,
                        nombre: permiso.nombre
                    }
                })
        } catch (err) {
            return res
                .status(500)
                .json(
                    {
                        ok: false,
                        message: "Error al actualizar el permiso"
                    })
        }
    }
    async delete(req, res) {
        const { id } = req.params;
        try {
            const deleted = await Permiso.destroy({ where: { id } })
            if (deleted === 1) {
                return res
                    .status(200)
                    .json(
                        {
                            ok: true,
                            message: "Permiso eliminado correctamente."
                        })
            } else {
                return res
                    .status(404)
                    .json({
                        ok: false,
                        message: "Permiso no encontrado."
                    })
            }
        } catch (err) {
            return res
                .status(500)
                .json({
                    ok: false,
                    message: "Error al eliminar el permiso."
                })
        }
    }
}
module.exports = PermisoController