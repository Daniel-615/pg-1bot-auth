const db = require("../models");
const Rol = db.getModel("Rol");
class RolController {
  async create(req, res) {
    const { nombre } = req.body;

    if (!nombre) {
      return res
        .status(400)
        .send({
          ok: false,
          message: "El nombre del rol es obligatorio"
        })
    }

    try {
      const existing = await Rol.findOne({ where: { nombre } });
      if (existing) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "El rol ya existe."
          });
      }

      const nuevoRol = await Rol.create({ nombre });
      if (!nuevoRol) {
        return res
          .status(500)
          .json({
            ok: false,
            message: "No se pudo crear el rol"
          })
      }
      return res
        .status(201)
        .json({
          ok: true,
          message: "Rol creado exitosamente.",
          rol: {
            id: nuevoRol.id,
            nombre: nuevoRol.Nombre
          }
        });
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al crear el rol."
        });
    }
  }

  async findAll(req, res) {
    try {
      const roles = await Rol.findAll();
      if (!roles) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "No se pudieron obtener los roles"
          })
      }
      return res
        .status(200)
        .json({
          ok: true,
          message: "Roles obtenidos exitosamente",
          data: roles
        })

    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al obtener los roles"
        })
    }
  }

  async findOne(req, res) {
    const {
      id
    } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "'id' falta en la url"
        })
    }
    try {
      const rol = await Rol.findByPk(id);
      if (!rol) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "Rol no encontrado"
          })
      }
      return res
        .status(200)
        .json({
          ok: true,
          message: "Rol encontrado exitosamente",
          data: rol
        })
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al obtener el rol"
        })
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "'id' falta en la url"
        })
    }
    if (!nombre) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Datos requeridos 'nombre'"
        })
    }
    try {
      const rol = await Rol.findByPk(id);
      if (!rol) {
        return res.status(404).send({ message: "Rol no encontrado." });
      }

      rol.Nombre = nombre;
      await rol.save();

      return res
        .status(200)
        .json({
          ok: true,
          message: "Rol actualizado",
          rol: { id: rol.id, nombre: rol.Nombre }
        })
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al actualizar el rol"
        })
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Datos requeridos 'id'"
        })
    }
    try {
      const deleted = await Rol.destroy({ where: { id } });

      if (deleted === 1) {
        return res
          .status(200)
          .json({
            ok: true,
            message: "Rol eliminado exitosamente"
          })
      } else {
        return res
          .status(404)
          .json({
            ok: false,
            message: "Rol no encontrado"
          })
      }
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al eliminar el rol"
        })
    }
  }
}

module.exports = RolController;
