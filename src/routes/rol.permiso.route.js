const express = require("express");
const RolPermisoController = require("../controllers/rol.permiso.controller.js");
const verifyToken = require('../middleware/auth.js');
const { checkPermisosDesdeRoles } = require("../middleware/checkRole.js");
const { validatePaginationQuery, validatePositiveIntegerBody, validatePositiveIntegerParams } = require("../middleware/inputValidation.js");

class RolPermisoRoutes {
  constructor(app) {
    this.router = express.Router();
    this.controller = new RolPermisoController();
    this.registerRoutes();
    app.use("/auth-service/rol-permiso", this.router);
  }

  registerRoutes() {
    /**
     * @openapi
     * tags:
     *   - name: Rol-Permiso
     *     description: Relaciones entre roles y permisos
     * components:
     *   schemas:
     *     RolPermisoKey:
     *       type: object
     *       properties:
     *         rolId:
     *           type: integer
     *           example: 2
     *         permisoId:
     *           type: integer
     *           example: 7
     *     CreateRolPermisoInput:
     *       allOf:
     *         - $ref: '#/components/schemas/RolPermisoKey'
     *     RolPermiso:
     *       allOf:
     *         - $ref: '#/components/schemas/RolPermisoKey'
     *         - type: object
     *           properties:
     *             createdAt:
     *               type: string
     *               format: date-time
     *             updatedAt:
     *               type: string
     *               format: date-time
     *     PermisoLite:
     *       type: object
     *       properties:
     *         id:
     *           type: integer
     *           example: 7
     *         nombre:
     *           type: string
     *           example: "asignar_permisos"
     *         descripcion:
     *           type: string
     *           nullable: true
     *           example: "Permite asignar permisos a un rol"
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         error:
     *           type: string
     */

    /**
     * @openapi
     * /auth-service/rol-permiso:
     *   post:
     *     summary: Crear relación rol-permiso
     *     tags: [Rol-Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateRolPermisoInput'
     *           example:
     *             rolId: 2
     *             permisoId: 7
     *     responses:
     *       201:
     *         description: Relación creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RolPermiso'
     *       400:
     *         description: Solicitud inválida
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       409:
     *         description: Ya existe la relación
     *       500:
     *         description: Error del servidor
     */
    this.router.post(
      "/",
      verifyToken,
      checkPermisosDesdeRoles(["asignar_permisos", "asignar_roles"]),
      validatePositiveIntegerBody(["rolId", "permisoId"]),
      this.controller.create.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/rol-permiso/rol-no-asignado/{rolId}:
     *   get:
     *     summary: Listar permisos NO asignados a un rol
     *     tags: [Rol-Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: rolId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID del rol
     *     responses:
     *       200:
     *         description: Permisos no asignados
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PermisoLite'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: Rol no encontrado
     *       500:
     *         description: Error del servidor
     */
    this.router.get(
      "/rol-no-asignado/:rolId",
      verifyToken,
      checkPermisosDesdeRoles(["ver_roles", "ver_permisos"]),
      validatePositiveIntegerParams(["rolId"]),
      this.controller.permisosNoAsignados.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/rol-permiso:
     *   get:
     *     summary: Listar todas las relaciones rol-permiso
     *     tags: [Rol-Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/RolPermiso'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       500:
     *         description: Error del servidor
     */
    this.router.get(
      "/",
      verifyToken,
      checkPermisosDesdeRoles(["ver_roles", "ver_permisos"]),
      validatePaginationQuery(),
      this.controller.findAll.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/rol-permiso/{rolId}/{permisoId}:
     *   get:
     *     summary: Obtener una relación por rolId y permisoId
     *     tags: [Rol-Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: rolId
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: permisoId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Relación encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RolPermiso'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: No encontrada
     *       500:
     *         description: Error del servidor
     */
    this.router.get(
      "/:rolId/:permisoId",
      verifyToken,
      checkPermisosDesdeRoles(["ver_permiso", "ver_rol"]),
      validatePositiveIntegerParams(["rolId", "permisoId"]),
      this.controller.findOne.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/rol-permiso/{rolId}/{permisoId}:
     *   delete:
     *     summary: Eliminar una relación por rolId y permisoId
     *     tags: [Rol-Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: rolId
     *         required: true
     *         schema:
     *           type: integer
     *       - in: path
     *         name: permisoId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Eliminado
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: No encontrada
     *       500:
     *         description: Error del servidor
     */
    this.router.delete(
      "/:rolId/:permisoId",
      verifyToken,
      checkPermisosDesdeRoles(["eliminar_rol", "eliminar_permiso"]),
      validatePositiveIntegerParams(["rolId", "permisoId"]),
      this.controller.delete.bind(this.controller)
    );
  }
}

module.exports = RolPermisoRoutes;
