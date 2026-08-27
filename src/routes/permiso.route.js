const express = require("express");
const PermisoController = require("../controllers/permiso.controller.js");
const verifyToken = require('../middleware/auth.js');
const { checkPermisosDesdeRoles } = require('../middleware/checkRole.js');
const { validatePaginationQuery, validatePositiveIntegerParams } = require('../middleware/inputValidation.js');

class PermisoRoutes{
  constructor(app){
    this.router = express.Router();
    this.controller = new PermisoController();
    this.registerRoutes();
    app.use("/auth-service/permiso", this.router);
  }

  registerRoutes(){
    /**
     * @openapi
     * tags:
     *   - name: Permiso
     *     description: Gestión de permisos
     * components:
     *   schemas:
     *     Permiso:
     *       type: object
     *       properties:
     *         id:
     *           type: integer
     *           example: 1
     *         nombre:
     *           type: string
     *           example: "ver_usuarios"
     *         descripcion:
     *           type: string
     *           nullable: true
     *           example: "Permite ver la lista de usuarios"
     *     CreatePermisoInput:
     *       type: object
     *       required: [nombre]
     *       properties:
     *         nombre:
     *           type: string
     *         descripcion:
     *           type: string
     *           nullable: true
     *     UpdatePermisoInput:
     *       type: object
     *       properties:
     *         nombre:
     *           type: string
     *         descripcion:
     *           type: string
     *           nullable: true
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         error:
     *           type: string
     */

    /**
     * @openapi
     * /auth-service/permiso:
     *   post:
     *     summary: Crear un nuevo permiso
     *     tags: [Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreatePermisoInput'
     *     responses:
     *       201:
     *         description: Permiso creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permiso'
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
     *       500:
     *         description: Error del servidor
     */
    this.router.post(
      "/",
      verifyToken,
      checkPermisosDesdeRoles(["asignar_permisos"]),
      (req, res) => this.controller.create(req, res)
    );

    /**
     * @openapi
     * /auth-service/permiso:
     *   get:
     *     summary: Obtener todos los permisos
     *     tags: [Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de permisos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Permiso'
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
      validatePaginationQuery(),
      (req, res) => this.controller.findAll(req, res)
    );

    /**
     * @openapi
     * /auth-service/permiso/{id}:
     *   get:
     *     summary: Obtener un permiso por ID
     *     tags: [Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID del permiso
     *     responses:
     *       200:
     *         description: Permiso encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permiso'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: No encontrado
     *       500:
     *         description: Error del servidor
     */
    this.router.get(
      "/:id",
      verifyToken,
      checkPermisosDesdeRoles(["ver_permiso"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.findOne(req, res)
    );

    /**
     * @openapi
     * /auth-service/permiso/{id}:
     *   put:
     *     summary: Actualizar un permiso
     *     tags: [Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID del permiso
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdatePermisoInput'
     *     responses:
     *       200:
     *         description: Permiso actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Permiso'
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: No encontrado
     *       500:
     *         description: Error del servidor
     */
    this.router.put(
      "/:id",
      verifyToken,
      checkPermisosDesdeRoles(["actualizar_permiso"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.update(req, res)
    );

    /**
     * @openapi
     * /auth-service/permiso/{id}:
     *   delete:
     *     summary: Eliminar un permiso
     *     tags: [Permiso]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID del permiso
     *     responses:
     *       204:
     *         description: Eliminado sin contenido
     *       401:
     *         description: No autenticado
     *       403:
     *         description: Sin permisos
     *       404:
     *         description: No encontrado
     *       500:
     *         description: Error del servidor
     */
    this.router.delete(
      "/:id",
      verifyToken,
      checkPermisosDesdeRoles(["eliminar_permiso"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.delete(req, res)
    );
  }
}

module.exports = PermisoRoutes;
