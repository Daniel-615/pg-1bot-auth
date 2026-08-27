const express = require("express");
const UsuarioRolController = require("../controllers/usuario.rol.controller.js");
const verifyToken = require('../middleware/auth.js');
const { checkPermisosDesdeRoles } = require('../middleware/checkRole.js');
const {
  validatePositiveIntegerBody,
  validatePositiveIntegerParams,
  validateUuidBody,
  validateUuidParams,
} = require('../middleware/inputValidation.js');

class UsuarioRolRoutes {
  constructor(app) {
    this.router = express.Router();
    this.controller = new UsuarioRolController();
    this.registerRoutes();
    app.use("/auth-service/usuario-rol", this.router);
  }

  registerRoutes() {
    /**
     * @openapi
     * tags:
     *   - name: Usuario-Rol
     *     description: Relaciones entre usuarios y roles
     * components:
     *   schemas:
     *     UsuarioRolKey:
     *       type: object
     *       properties:
     *         usuarioId:
     *           type: string
     *           format: uuid
     *           example: "550e8400-e29b-41d4-a716-446655440000"
     *         rolId:
     *           type: integer
     *           example: 3
     *     CreateUsuarioRolInput:
     *       allOf:
     *         - $ref: '#/components/schemas/UsuarioRolKey'
     *     UsuarioRol:
     *       allOf:
     *         - $ref: '#/components/schemas/UsuarioRolKey'
     *         - type: object
     *           properties:
     *             createdAt:
     *               type: string
     *               format: date-time
     *             updatedAt:
     *               type: string
     *               format: date-time
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         error:
     *           type: string
     */

    /**
     * @openapi
     * /auth-service/usuario-rol:
     *   post:
     *     summary: Crear relación usuario-rol
     *     tags: [Usuario-Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUsuarioRolInput'
     *           example:
     *             usuarioId: "550e8400-e29b-41d4-a716-446655440000"
     *             rolId: 3
     *     responses:
     *       201:
     *         description: Relación creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UsuarioRol'
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
      validateUuidBody(["usuarioId"]),
      validatePositiveIntegerBody(["rolId"]),
      this.controller.create.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/usuario-rol:
     *   get:
     *     summary: Listar todas las relaciones usuario-rol
     *     tags: [Usuario-Rol]
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
     *                 $ref: '#/components/schemas/UsuarioRol'
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
      checkPermisosDesdeRoles(["ver_roles","ver_usuarios"]),
      this.controller.findAll.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/usuario-rol/{usuarioId}/{rolId}:
     *   get:
     *     summary: Obtener una relación usuario-rol específica
     *     tags: [Usuario-Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: usuarioId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: path
     *         name: rolId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Relación encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UsuarioRol'
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
      "/:usuarioId/:rolId",
      verifyToken,
      checkPermisosDesdeRoles(["ver_rol","ver_usuario"]),
      validateUuidParams(["usuarioId"]),
      validatePositiveIntegerParams(["rolId"]),
      this.controller.findOne.bind(this.controller)
    );

    /**
     * @openapi
     * /auth-service/usuario-rol/{usuarioId}/{rolId}:
     *   delete:
     *     summary: Eliminar una relación usuario-rol
     *     tags: [Usuario-Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: usuarioId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: path
     *         name: rolId
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
      "/:usuarioId/:rolId",
      verifyToken,
      checkPermisosDesdeRoles(["eliminar_rol","eliminar_usuario"]),
      validateUuidParams(["usuarioId"]),
      validatePositiveIntegerParams(["rolId"]),
      this.controller.delete.bind(this.controller)
    );
  }
}

module.exports = UsuarioRolRoutes;
