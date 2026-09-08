const express = require("express");
const UsuarioController = require("../controllers/usuario.controller.js");
const verifyToken = require('../middleware/auth.js');
const { checkPermisosDesdeRoles } = require('../middleware/checkRole.js');
const { authRateLimiter } = require('../middleware/rateLimit.js');
const { validateSearchQuery, validateUuidParams } = require('../middleware/inputValidation.js');

const strictAuthLimiter = authRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

class UsuarioRoutes {
  constructor(app) {
    this.router = express.Router();
    this.controller = new UsuarioController();
    this.registerRoutes();
    app.use("/auth-service/usuario", this.router);
  }

  registerRoutes() {
    /**
     * @openapi
     * tags:
     *   - name: Usuario
     *     description: Autenticación y gestión de usuarios
     * components:
     *   schemas:
     *     Usuario:
     *       type: object
     *       properties:
     *         id: { type: string, format: uuid, example: "550e8400-e29b-41d4-a716-446655440000" }
     *         nombre: { type: string, example: "Susy Garcia" }
     *         email: { type: string, format: email, example: "susy@example.com" }
     *         activo: { type: boolean, example: true }
     *         roles:
     *           type: array
     *           items: { type: string }
     *           example: ["admin","empleado"]
     *         createdAt: { type: string, format: date-time }
     *         updatedAt: { type: string, format: date-time }
     *     LoginInput:
     *       type: object
     *       required: [email, password]
     *       properties:
     *         email: { type: string, format: email }
     *         password: { type: string, format: password }
     *       example:
     *         email: "user@mail.com"
     *         password: "secret123"
     *     RegisterInput:
     *       type: object
     *       required: [nombre, apellido, email, password, edad]
     *       properties:
     *         nombre: { type: string }
     *         email: { type: string, format: email }
      *         password: { type: string, format: password }
     *         edad: { type: integer, minimum: 5, maximum: 120 }
     *     UpdateUsuarioInput:
     *       type: object
     *       properties:
     *         nombre: { type: string }
     *         email: { type: string, format: email }
     *         password: { type: string, format: password }
     *     TokenPair:
     *       type: object
     *       properties:
     *         accessToken: { type: string }
     *         refreshToken: { type: string }
     *     VerifyResponse:
     *       type: object
     *       properties:
     *         valid: { type: boolean, example: true }
     *         user:
     *           $ref: '#/components/schemas/Usuario'
     *     MessageResponse:
     *       type: object
     *       properties:
     *         message: { type: string }
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         error: { type: string }
     */

    /**
     * @openapi
     * /auth-service/usuario/login:
     *   post:
     *     summary: Iniciar sesión (email/password)
     *     tags: [Usuario]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/LoginInput' }
     *     responses:
     *       200:
     *         description: Usuario autenticado (cookies httpOnly o tokens según implementación)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user: { $ref: '#/components/schemas/Usuario' }
     *                 tokens: { $ref: '#/components/schemas/TokenPair' }
     *       401:
     *         description: Credenciales inválidas
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/ErrorResponse' }
     */
    this.router.post("/login", strictAuthLimiter, (req, res) => {
       this.controller.login(req, res);
     });

     this.router.get("/google", (req, res) => {
       this.controller.startGoogleLogin(req, res);
     });

     this.router.get("/google/callback", (req, res) => {
       this.controller.googleCallback(req, res);
     });

    this.router.post("/forgot-password", strictAuthLimiter, (req, res) => {
      this.controller.sendResetPassword(req, res);
    });

     this.router.post("/reset-password", strictAuthLimiter, (req, res) => {
       this.controller.resetPassword(req, res);
     });

     this.router.post("/verify-email", strictAuthLimiter, (req, res) => {
       this.controller.verifyEmail(req, res);
     });

     this.router.post("/resend-verification", strictAuthLimiter, (req, res) => {
       this.controller.resendVerificationCode(req, res);
     });

    /**
     * @openapi
     * /auth-service/usuario/register:
     *   post:
     *     summary: Registrar usuario (self-service)
     *     tags: [Usuario]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/RegisterInput' }
     *     responses:
     *       201:
     *         description: Usuario registrado
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Usuario' }
     *       400:
     *         description: Solicitud inválida
     *       500:
     *         description: Error al registrar el usuario
     */
    this.router.post("/register", strictAuthLimiter, (req, res) => {
      try {
        this.controller.create(req, res);
      } catch (err) {
        console.error(`Error al registrar el usuario: ${err.message}`);
        res.status(500).send({ message: "Error al registrar el usuario" });
      }
    });

    /**
     * @openapi
     * /auth-service/usuario/register-admin:
     *   post:
     *     summary: Registrar usuario (admin) con asignación de rol
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/RegisterInput' }
     *     responses:
     *       201:
     *         description: Usuario creado por admin
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Usuario' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     */
    this.router.post(
      "/register-admin",
      verifyToken,
      checkPermisosDesdeRoles(["asignar_roles"]),
      (req, res) => {
        this.controller.create(req, res);
      }
    );

    /**
     * @openapi
     * /auth-service/usuario/logout:
     *   post:
     *     summary: Cerrar sesión (invalida refresh y limpia cookies)
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Sesión cerrada
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/MessageResponse' }
     *       401: { description: No autenticado }
     */
    this.router.post("/logout", verifyToken, (req, res) => {
      try {
        this.controller.logout(req, res);
      } catch (err) {
        console.error(`Error al cerrar sesión: ${err.message}`);
        res.status(500).send({ message: "Error al cerrar sesión" });
      }
    });

    /**
     * @openapi
     * /auth-service/usuario/refreshToken:
     *   post:
     *     summary: Renovar access token (usa cookie o body según implementación)
     *     tags: [Usuario]
     *     responses:
     *       200:
     *         description: Token renovado
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 accessToken: { type: string }
     *       401:
     *         description: Refresh inválido o expirado
     */
    this.router.post("/refreshToken", strictAuthLimiter, (req, res) => {
      this.controller.refreshToken(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/verifyToken:
     *   get:
     *     summary: Verificar token/estado de sesión
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token válido
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/VerifyResponse' }
     *       401: { description: Token inválido/ausente }
     */
    this.router.get("/verifyToken",verifyToken,(req,res)=>{
      this.controller.verifyRefreshToken(req,res);
    });

    /**
     * @openapi
     * /auth-service/usuario/{id}:
     *   put:
     *     summary: Actualizar usuario
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema: { type: string, format: uuid }
     *         required: true
     *         description: ID del usuario
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/UpdateUsuarioInput' }
     *     responses:
     *       200:
     *         description: Usuario actualizado
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Usuario' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     *       404: { description: No encontrado }
     */
    this.router.put("/:id", verifyToken,checkPermisosDesdeRoles(["actualizar_usuario"]), validateUuidParams(["id"]), (req, res) => {
      this.controller.update(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/deactivateAccount/{id}:
     *   post:
     *     summary: Desactivar cuenta de usuario
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema: { type: string, format: uuid }
     *         required: true
     *         description: ID del usuario
     *     responses:
     *       200:
     *         description: Cuenta desactivada
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/MessageResponse' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     *       404: { description: No encontrado }
     */
    this.router.post("/deactivateAccount/:id", verifyToken, checkPermisosDesdeRoles(["desactivar_cuenta"]), validateUuidParams(["id"]),(req, res) => {
      this.controller.deactivateAccount(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/findOne/{id}:
     *   get:
     *     summary: Obtener un usuario por ID
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema: { type: string, format: uuid }
     *         required: true
     *     responses:
     *       200:
     *         description: Usuario encontrado
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Usuario' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     *       404: { description: No encontrado }
     */
    this.router.get("/findOne/:id", verifyToken, checkPermisosDesdeRoles(["ver_usuario"]), validateUuidParams(["id"]),(req, res) => {
      this.controller.findOne(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/findAll:
     *   get:
     *     summary: Listar usuarios
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de usuarios
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items: { $ref: '#/components/schemas/Usuario' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     */
    this.router.get("/findAll", verifyToken, checkPermisosDesdeRoles(["ver_usuarios"]), validateSearchQuery("nombre"),(req, res) => {
      this.controller.findAll(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/findAllActivos:
     *   get:
     *     summary: Listar usuarios activos
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lista de usuarios activos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items: { $ref: '#/components/schemas/Usuario' }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     */
    this.router.get("/findAllActivos", verifyToken,checkPermisosDesdeRoles(["ver_usuarios_activos"]), (req, res) => {
      this.controller.findAllActivos(req, res);
    });

    /**
     * @openapi
     * /auth-service/usuario/{id}:
     *   delete:
     *     summary: Eliminar usuario
     *     tags: [Usuario]
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema: { type: string, format: uuid }
     *         required: true
     *     responses:
     *       204: { description: Eliminado sin contenido }
     *       401: { description: No autenticado }
     *       403: { description: Sin permisos }
     *       404: { description: No encontrado }
     */
    this.router.delete("/:id", verifyToken,checkPermisosDesdeRoles(["eliminar_usuario"]), validateUuidParams(["id"]), (req, res) => {
      this.controller.delete(req, res);
    });

  }
}

module.exports = UsuarioRoutes;
