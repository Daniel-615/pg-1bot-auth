const db = require("../models");
const crypto = require("crypto");
const Usuario = db.getModel("Usuario");
const Rol = db.getModel("Rol");
const Op = db.Sequelize.Op;
const jwt = require("jsonwebtoken");
const { generarTokensYEnviar } = require("../middleware/sendTokens.js");
const {
  SECRET_JWT_KEY,
  FRONTEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = require("../config/config.js");
const { OAuth2Client } = require("google-auth-library");
const validation_user = require("../middleware/validationUser.js");
const cookieOptions = require("../middleware/cookieOptions.js");
const { hashToken } = require("../middleware/tokenSecurity.js");
const { enviarCorreoRecuperacion, enviarCodigoVerificacion } = require("../services/email.service.js");
const UsuarioRol = db.getModel("UsuarioRol");
class UsuarioController {
  googleClient() {
    return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  }

  googleFailure(res, message) {
    const redirect = new URL("/login", FRONTEND_URL || "http://localhost:5173");
    redirect.searchParams.set("google_error", message);
    return res.redirect(redirect.toString());
  }

  startGoogleLogin(req, res) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      return res.status(503).json({ ok: false, message: "La autenticación con Google no está configurada." });
    }

    const state = crypto.randomBytes(32).toString("hex");
    res.cookie("google_oauth_state", state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000
    });

    const authorizationUrl = this.googleClient().generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account"
    });

    return res.redirect(authorizationUrl);
  }

  async googleCallback(req, res) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      return this.googleFailure(res, "La autenticación con Google no está configurada.");
    }

    const { code, state, error } = req.query;
    const expectedState = req.cookies?.google_oauth_state;
    res.clearCookie("google_oauth_state", cookieOptions);

    if (error) return this.googleFailure(res, "El acceso con Google fue cancelado.");
    if (!code || !state || !expectedState || state !== expectedState) {
      return this.googleFailure(res, "La solicitud de autenticación no es válida.");
    }

    try {
      const client = this.googleClient();
      const { tokens } = await client.getToken(String(code));
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID
      });
      const profile = ticket.getPayload();

      if (!profile?.email || profile.email_verified !== true) {
        return this.googleFailure(res, "Google no pudo verificar tu correo.");
      }

      const email = profile.email.trim().toLowerCase();
      let usuario = await Usuario.findOne({ where: { email } });

      if (!usuario) {
        const [rolEstudiante] = await Rol.findOrCreate({
          where: { nombre: { [Op.iLike]: "estudiante" } },
          defaults: { nombre: "estudiante" }
        });

        usuario = Usuario.build({
          nombre: profile.given_name || profile.name || email.split("@")[0],
          apellido: profile.family_name || "",
          email,
          password: crypto.randomBytes(32).toString("hex"),
          status: true,
          emailVerified: true
        });
        await usuario.save();
        await UsuarioRol.create({ usuarioId: usuario.id, rolId: rolEstudiante.id });
      } else if (!usuario.status || !usuario.emailVerified) {
        usuario.status = true;
        usuario.emailVerified = true;
        await usuario.save();
      }

      const roles = await usuario.getRoles();
      const { accessToken } = await generarTokensYEnviar(usuario, res, roles.map((role) => role.nombre));
      const redirect = new URL("/", FRONTEND_URL || "http://localhost:5173");
      // El fragmento no se envía al servidor ni queda en los logs como un query param.
      redirect.hash = `access_token=${encodeURIComponent(accessToken)}`;
      return res.redirect(redirect.toString());
    } catch (err) {
      console.error("Error en autenticación con Google:", err.message);
      return this.googleFailure(res, "No se pudo completar el acceso con Google.");
    }
  }

  createVerificationCode() {
    const code = String(crypto.randomInt(100000, 1000000));
    return {
      code,
      hash: crypto.createHash("sha256").update(code).digest("hex"),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
  }

  async verifyRefreshToken(req, res) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res
        .status(401).send({
          message: "No se encontró el token de sesión."
        })
    }
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY);
      const usuario = await Usuario.findOne({
        where: {
          id: decoded.id,
          email: decoded.email,
          refreshToken: hashToken(token),
          status: true
        },
        include: {
          model: Rol,
          as: 'roles',
          include: {
            model: db.getModel('Permiso'),
            as: 'Permisos',
            attributes: ['nombre'],
            through: { attributes: [] }
          }
        }
      })
      if (!usuario) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "Usuario no encontrado"
          })
      }
      return res
        .status(200)
        .send({
          "userId": usuario.id,
          "email": usuario.email,
          "rol": decoded.rol,
          "nombre": decoded.nombre,
          "apellido": decoded.apellido,
          "edad": usuario.edad,
          "roles": usuario.roles.map((rol) => ({ id: rol.id, nombre: rol.nombre })),
          "permisos": [...new Set(usuario.roles.flatMap((rol) => rol.Permisos.map((permiso) => permiso.nombre)))]
        })
    } catch (error) {
      return res
        .status(403)
        .send({
          message: "Token inválido o expirado:"
        })

    }
  }
  async create(req, res) {
    const { nombre, apellido, email, password, edad, status, rolId } = req.body;

    if (!nombre || !apellido || !email || !password || edad === undefined) {
      return res
        .status(400)
        .json({ ok: false, message: "Faltan campos obligatorios." });
    }

    try {
      // Validaciones
      const nombreValidado = validation_user.userName(nombre);
      const emailValidado = validation_user.email(email);
      const passwordValidado = validation_user.password(password);
      const edadValidada = validation_user.age(edad);

      // Verificar duplicados
      const existingUsername = await Usuario.findOne({ where: { nombre: nombreValidado, apellido } });
      if (existingUsername) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "El nombre de usuario ya está en uso."
          });
      }

      const existingUserEmail = await Usuario.findOne({ where: { email: emailValidado } });
      if (existingUserEmail) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "El correo ya está registrado."
          });
      }

      // Crear usuario
      const nuevoUsuario = Usuario.build();
      nuevoUsuario.Nombre = nombreValidado;
      nuevoUsuario.Apellido = apellido;
      nuevoUsuario.edad = edadValidada;
      nuevoUsuario.Email = emailValidado;
      nuevoUsuario.Password = passwordValidado;
      nuevoUsuario.Status = false;
      nuevoUsuario.emailVerified = false;


      let rolAsignado;

       if (req.user && req.user.id) {
        // Usuario autenticado: debe proporcionar rolId
        if (!rolId) {
          return res.status(400).json({
            ok: false,
            message: "El campo 'rolId' es obligatorio al registrar usuarios autenticado."
          });
        }

         const rolIdNumerico = Number(rolId);
         const rolSeleccionado = await Rol.findByPk(rolIdNumerico);
         const nombreRol = rolSeleccionado?.nombre?.trim().toLowerCase().replace(/\s+/g, "");

         if (!rolSeleccionado) {
           return res.status(400).json({ ok: false, message: "El rol seleccionado no existe." });
         }

         if (!["empleado", "1botpersonal"].includes(nombreRol)) {
           return res.status(400).send({
             message: "Solo se permite asignar los roles empleado o 1botpersonal."
           });
         }

        rolAsignado = rolIdNumerico;
      } else {
        const rolEstudiante = await Rol.findOne({ where: { nombre: { [Op.iLike]: "estudiante" } } });

        if (!rolEstudiante) {
          return res.status(500).json({
            ok: false,
            message: "El rol por defecto 'estudiante' no está configurado."
          });
        }

        rolAsignado = rolEstudiante.id;
      }
      await nuevoUsuario.save();

      await UsuarioRol.create({
        usuarioId: nuevoUsuario.id,
        rolId: rolAsignado
      });

      const verification = this.createVerificationCode();
      nuevoUsuario.verificationCodeHash = verification.hash;
      nuevoUsuario.verificationCodeExpiresAt = verification.expiresAt;
      nuevoUsuario.verificationAttempts = 0;
      await nuevoUsuario.save();
      await enviarCodigoVerificacion(nuevoUsuario.email, verification.code);

      return res.status(201).json({
        ok: true,
        message: "Usuario registrado. Revisa tu correo para confirmar la cuenta.",
        requiresVerification: true,
        email: nuevoUsuario.email,
      });

    } catch (err) {
      if (validation_user.isValidationError(err)) {
        return res.status(err.statusCode).json({
          ok: false,
          message: err.message
        });
      }

      console.error("Error al crear usuario:", err);
      return res.status(500).json({
        ok: false,
        message: err.message || "Ocurrió un error al crear el usuario."
      });
    }
  }


  async findAll(req, res) {
    const nombre = req.query.nombre;
    const condition = nombre ? { nombre: { [Op.iLike]: `%${nombre}%` } } : null;

    try {
      const usuarios = await Usuario.findAll({
        where: condition,
        include: [
          {
            model: db.getModel("UsuarioRol"),
            as: 'usuario_roles',
            include: [
              {
                model: db.getModel("Rol"),
                as: "rol",
              },
            ],
          },
        ],
      });

      const usuariosConFullName = usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        status: u.Status,
        rol: u.usuario_roles?.[0]?.rol?.nombre || null,
      }));
      if (!usuariosConFullName) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "No se encontraron usuarios"
          })
      }
      return res.status(200).json({
        ok: true,
        data: usuariosConFullName
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: err.message || "Error al obtener los usuarios.",
      });
    }
  }

  async findAllActivos(req, res) {
    try {
      const activos = await Usuario.findAll({
        where: { status: true },
        include: [
          {
            model: db.getModel("UsuarioRol"),
            as: 'usuario_roles',
            include: [
              {
                model: db.getModel("Rol"),
                as: "rol",
              },
            ],
          },
        ],
      });

      const resultado = activos.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        rol: u.usuario_roles?.[0]?.rol?.nombre,
        estado: u.estado,
      }));
      if (!activos) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "No hay usuarios activos"
          })
      }
      return res
        .status(200)
        .json({
          ok: true,
          data: resultado
        });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: err.message || "Error al obtener usuarios activos.",
      });
    }
  }


  // Obtener un usuario por ID
  async findOne(req, res) {
    const id = req.params.id;
    try {
      const usuario = await Usuario.findByPk(id, {
        include: [
          {
            model: db.getModel("UsuarioRol"),
            as: "usuario_roles",
            include: [
              {
                model: db.getModel("Rol"),
                as: "rol",
                include: [
                  {
                    model: db.getModel("Permiso"),
                    as: 'Permisos',
                    through: { attributes: [] },
                  }
                ]
              }
            ]
          }
        ]
      });
      if (!usuario) {
        return res
          .status(404)
          .json({ ok: false, message: "Usuario no encontrado." });
      }

      return res
        .status(200)
        .json({
          ok: true,
          user: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.usuario_roles?.[0]?.rol?.nombre || null,
            permisos: usuario.usuario_roles?.[0]?.rol?.Permisos?.map(p => p.nombre) || []
          }

        });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: `Error al obtener el usuario con id=${id}`
      });
    }
  }
  async refreshToken(req, res) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(403).send({ message: "No hay refresh token." });
    }

    try {
      const usuario = await Usuario.findOne({ where: { refreshToken: hashToken(refreshToken) } });

      if (!usuario) {
        return res.status(403).send({ message: "Token inválido o usuario no encontrado." });
      }

      jwt.verify(refreshToken, SECRET_JWT_KEY, async (err, decoded) => {
        if (err || usuario.email !== decoded.email) {
          return res.status(403).send({ message: "Token inválido." });
        }

        const newAccessToken = jwt.sign(
          { id: usuario.id, email: usuario.email },
          SECRET_JWT_KEY,
          { expiresIn: "1h" }
        );

        res
          .cookie("access_token", newAccessToken, {
            ...cookieOptions,
            maxAge: 60 * 60 * 1000 // 1 hora de vida
          })
          .send({
            message: "Token renovado exitosamente.",
            success: true,
            userId: usuario.id,
          });
      });
    } catch (err) {
      console.error("Error al renovar token:", err.message);
      res.status(500).send({ message: "Error al renovar el token." });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = validation_user.loginCredentials(req.body);
      const usuario = await Usuario.findOne({ where: { email, status: true } });

      if (!usuario) {
        const pendingUser = await Usuario.findOne({ where: { email } });
        if (pendingUser && pendingUser.emailVerified === false) {
          return res.status(403).json({
            ok: false,
            message: "Debes confirmar tu correo antes de iniciar sesión.",
            requiresVerification: true,
            email
          });
        }
        return res
          .status(401)
          .json({
            ok: false,
            message: "Credenciales inválidas."
          });
      }

      const call = await usuario.isValid(password, usuario.password);
      if (!call) {
        return res
          .status(401)
          .json({
            ok: false,
            message: "Credenciales inválidas."
          });
      }
      const roles = await usuario.getRoles({
        include: [
          {
            model: db.getModel("Permiso"),
            as: "Permisos"
          }
        ]
      });
      const rolesNombre = roles.map(r => r.nombre);

      await generarTokensYEnviar(usuario, res, rolesNombre);

      await usuario.save();

      return res
        .status(200)
        .json({
          ok: true,
          message: "Inicio de sesión exitoso.",
          "user": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "edad": usuario.edad,
            "rol": rolesNombre
          }
        })
    } catch (err) {
      if (validation_user.isValidationError(err)) {
        return res
          .status(err.statusCode)
          .json({
            ok: false,
            message: err.message
          });
      }

      console.log(`Error al iniciar sesión: ${err.message}`);
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al iniciar sesión"
        });
    }
  }

  async verifyEmail(req, res) {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ ok: false, message: "Correo y código OTP válido son obligatorios." });
    }

    try {
      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario || usuario.emailVerified) {
        return res.status(400).json({ ok: false, message: "El código no es válido o la cuenta ya está confirmada." });
      }
      if (usuario.verificationAttempts >= 5) {
        return res.status(429).json({ ok: false, message: "Demasiados intentos. Solicita un nuevo código." });
      }
      if (!usuario.verificationCodeExpiresAt || usuario.verificationCodeExpiresAt.getTime() < Date.now()) {
        return res.status(400).json({ ok: false, message: "El código expiró. Solicita uno nuevo." });
      }

      const expected = Buffer.from(usuario.verificationCodeHash || "");
      const received = crypto.createHash("sha256").update(code).digest("hex");
      const valid = expected.length === received.length && crypto.timingSafeEqual(expected, Buffer.from(received));
      if (!valid) {
        usuario.verificationAttempts += 1;
        await usuario.save();
        return res.status(400).json({ ok: false, message: "El código OTP es incorrecto." });
      }

      usuario.emailVerified = true;
      usuario.status = true;
      usuario.verificationCodeHash = null;
      usuario.verificationCodeExpiresAt = null;
      usuario.verificationAttempts = 0;
      await usuario.save();
      return res.status(200).json({ ok: true, message: "Cuenta confirmada. Ya puedes iniciar sesión." });
    } catch (err) {
      return res.status(500).json({ ok: false, message: "No se pudo confirmar la cuenta." });
    }
  }

  async resendVerificationCode(req, res) {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: "El correo electrónico es obligatorio." });
    try {
      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario || usuario.emailVerified) return res.status(200).json({ ok: true, message: "Si la cuenta necesita confirmación, recibirás un nuevo código." });
      const verification = this.createVerificationCode();
      usuario.verificationCodeHash = verification.hash;
      usuario.verificationCodeExpiresAt = verification.expiresAt;
      usuario.verificationAttempts = 0;
      await usuario.save();
      await enviarCodigoVerificacion(usuario.email, verification.code);
      return res.status(200).json({ ok: true, message: "Se envió un nuevo código." });
    } catch (err) {
      return res.status(500).json({ ok: false, message: "No se pudo enviar un nuevo código." });
    }
  }
  // Actualizar un usuario
  async update(req, res) {
    const id = req.params.id;
    if (!id) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Falta 'id' en la url"
        })
    }
    try {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res
          .status(404)
          .json({
            ok: false,
            message: "Usuario no encontrado o inactivo."
          });
      }

      const {
        nombre,
        apellido,
        email
      } = req.body;
      if (!nombre || !apellido) {
        return res
          .status(400)
          .json({
            ok: false,
            message: "Se requieren todos los campos."
          })
      }

      validation_user.userName(nombre + apellido)
      usuario.nombre = nombre;
      usuario.apellido = apellido;
      if (email) {
        validation_user.email(email)
        usuario.email = email;
      }
      await usuario.save();
      return res.json({
        ok: true,
        message: "Usuario actualizado.",
        user: {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
        }
      });
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: `Error al actualizar el usuario con id=${id}`
        });
    }
  }
  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refresh_token;

      if (refreshToken) {
        const usuario = await Usuario.findOne({ where: { refreshToken: hashToken(refreshToken) } });
        if (usuario) {
          usuario.refreshToken = null;
          await usuario.save();
        }
      }

      res.clearCookie("access_token", { ...cookieOptions, maxAge: 0 });
      res.clearCookie("refresh_token", { ...cookieOptions, maxAge: 0 });
      return res
        .status(200)
        .json({
          ok: true,
          message: "Sesión cerrada exitosamente"
        });
    } catch (err) {
      return res
        .status(500)
        .json({
          ok: false,
          message: "Error al cerrar sesión"
        });
    }
  }



  //PANEL ADMINISTRADOR delete y mostrar todos los usuarios activos.
  // Eliminar un usuario
  async delete(req, res) {
    const id = req.params.id;
    if (!id) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Falta 'id' en la url"
        })
    }
    try {
      const deleted = await Usuario.destroy({ where: { id } });

      if (deleted === 1) {
        return res
          .status(200)
          .json({
            ok: true,
            message: "Usuario eliminado exitosamente"
          });
      } else {
        return res
          .status(500)
          .json({
            ok: false,
            message: `No se pudo eliminar el usuario con id=${id}.`
          });
      }
    } catch (err) {
      return res
        .status(500)
        .send({
          ok: false,
          message: `Error al eliminar el usuario con id=${id}`
        });
    }
  }
  //Eliminar cuenta para los usuarios activos 
  async deactivateAccount(req, res) {
    const id = req.params.id;
    if (!id) {
      return res.status(400).send({
        ok: false,
        message: "ID de usuario no proporcionado."
      });
    }
    try {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
      }
      usuario.Status = false;
      await usuario.save();
      return res
        .status(200)
        .json({
          ok: true,
          message: "Cuenta desactivada exitosamente.",
        });
    } catch (err) {
      return res.status(500).send({
        ok: false,
        message: "Error al desactivar la cuenta"
      });
    }
  }

  async resetPassword(req, res) {
    const { token } = req.query;
    const { newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, message: "Token o nueva contraseña no proporcionados." });
    }
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY);
      const usuario = await Usuario.findByPk(decoded.id);

      if (!usuario || usuario.resetToken !== token) {
        return res.status(404).send({ message: "Usuario no encontrado o token inválido." });
      }

      usuario.Password = validation_user.password(newPassword);
      usuario.resetToken = null; // Limpiar el token de restablecimiento
      await usuario.save();

      return res.send({ ok: true, message: "Contraseña restablecida exitosamente." });
    } catch (err) {
      console.error(`Error al restablecer la contraseña: ${err.message}`);
      return res.status(err.name === 'TokenExpiredError' || err.name === 'ValidationError' ? 400 : 500).send({ ok: false, message: err.name === 'ValidationError' ? err.message : "El enlace de recuperación no es válido o expiró." });
    }
  }
  async sendResetPassword(req, res) {
    const email = String(req.body.email || '').trim().toLowerCase();
    const genericResponse = { ok: true, message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña." };
    if (!email) return res.status(400).json({ ok: false, message: "El correo electrónico es obligatorio." });
    try {
      const usuario = await Usuario.findOne({ where: { email, status: true } })
      if (!usuario) {
        return res.status(200).send(genericResponse);
      }
      //Generar token de recuperación
      const resetToken = jwt.sign(
        { id: usuario.id, email: usuario.email },
        SECRET_JWT_KEY,
        { expiresIn: "15m" } // Expira en 15 minutos
      )
      //Enviar correo de recuperación
      await enviarCorreoRecuperacion(email, resetToken);
      usuario.resetToken = resetToken;
      await usuario.save();
      return res.status(200).send(genericResponse);
    } catch (err) {
      console.error(`Error al enviar correo de recuperación: ${err.message}`);
      res.status(500).send({
        message: "Error interno del servidor"
      });
    }
  }
}
module.exports = UsuarioController;
