const express= require("express");
const RolController = require("../controllers/rol.controller.js");
const verifyToken = require('../middleware/auth.js');
const { checkPermisosDesdeRoles } = require('../middleware/checkRole.js');
const { validatePositiveIntegerParams } = require('../middleware/inputValidation.js');

class RolRoutes{
  constructor(app){
    this.router = express.Router();
    this.controller = new RolController();
    this.registerRoutes();
    app.use("/auth-service/rol", this.router);
  }

  registerRoutes(){
    /**
     * @openapi
     * tags:
     *   - name: Rol
     *     description: Gestión de roles
     * components:
     *   schemas:
     *     Rol:
     *       type: object
     *       properties:
     *         id:
     *           type: integer
     *           example: 3
     *         nombre:
     *           type: string
     *           example: "admin"
     *         descripcion:
     *           type: string
     *           nullable: true
     *           example: "Rol con privilegios administrativos"
     *         createdAt:
     *           type: string
     *           format: date-time
     *         updatedAt:
     *           type: string
     *           format: date-time
     *     CreateRolInput:
     *       type: object
     *       required: [nombre]
     *       properties:
     *         nombre:
     *           type: string
     *           example: "editor"
     *         descripcion:
     *           type: string
     *           nullable: true
     *           example: "Puede editar recursos"
     *     UpdateRolInput:
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
     * /auth-service/rol:
     *   post:
     *     summary: Crear un nuevo rol
     *     tags: [Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateRolInput'
     *     responses:
     *       201:
     *         description: Rol creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Rol'
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
      checkPermisosDesdeRoles(["asignar_roles"]),
      (req, res) => this.controller.create(req, res)
    );

    /**
     * @openapi
     * /auth-service/rol:
     *   get:
     *     summary: Obtener todos los roles
     *     tags: [Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de roles
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Rol'
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
      checkPermisosDesdeRoles(["ver_roles"]),
      (req, res) => this.controller.findAll(req, res)
    );

    /**
     * @openapi
     * /auth-service/rol/{id}:
     *   get:
     *     summary: Obtener un rol por ID
     *     tags: [Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID del rol
     *     responses:
     *       200:
     *         description: Rol encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Rol'
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
      checkPermisosDesdeRoles(["ver_rol"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.findOne(req, res)
    );

    /**
     * @openapi
     * /auth-service/rol/{id}:
     *   put:
     *     summary: Actualizar un rol
     *     tags: [Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID del rol
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateRolInput'
     *     responses:
     *       200:
     *         description: Rol actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Rol'
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
      checkPermisosDesdeRoles(["actualizar_rol"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.update(req, res)
    );

    /**
     * @openapi
     * /auth-service/rol/{id}:
     *   delete:
     *     summary: Eliminar un rol
     *     tags: [Rol]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID del rol
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
      checkPermisosDesdeRoles(["eliminar_rol"]),
      validatePositiveIntegerParams(["id"]),
      (req, res) => this.controller.delete(req, res)
    );
  }
}

module.exports = RolRoutes;
