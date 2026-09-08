const express = require('express');
const cors = require('cors');
const { PORT, BACKEND_URL, FRONTEND_URL, FRONTEND_URLS } = require('./src/config/config.js');
const db = require('./src/models');
const cookieParser = require('cookie-parser');
const { rateLimiter } = require('./src/middleware/rateLimit.js');

const allowedOrigins = [...new Set([
  ...(FRONTEND_URLS || '').split(','),
  FRONTEND_URL,
].map((origin) => origin?.trim().replace(/\/$/, '')).filter(Boolean))];


const swaggerJsdoc = require('swagger-jsdoc');
const { apiReference } = require('@scalar/express-api-reference');

const UsuarioRoutes = require('./src/routes/usuario.route.js');
const RolRoutes = require('./src/routes/rol.route.js');
const PermisoRoutes = require('./src/routes/permiso.route.js');
const RolPermisoRoutes = require('./src/routes/rol.permiso.route.js');
const UsuarioRolRoutes = require('./src/routes/usuario.rol.route.js');

class Server {
  constructor() {
    this.app = express();
    this.port = PORT;

    // Solo confiar en X-Forwarded-For cuando el despliegue está detrás de un proxy conocido.
    this.app.set('trust proxy', process.env.TRUST_PROXY === 'true');

    this.app.use(cookieParser());

    this.configureMiddlewares();
    this.configureOpenAPI();
    this.configureRoutes();
    this.connectDatabase();
  }

  configureMiddlewares() {
    // Límite global para evitar que una sola IP consuma todos los workers.
    this.app.use(rateLimiter({ windowMs: 60 * 1000, max: 120 }));

    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Set-Cookie"]
    }));

    this.app.use(express.json({ limit: '100kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  }

  configureOpenAPI() {
    const openapiDefinition = {
      openapi: '3.0.3',
      info: {
        title: 'API Gateway',
        version: '1.0.0',
        description: 'Documentación unificada del API Gateway',
      },
      servers: [
        { url: `http://localhost:${this.port}` },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
        },
      },
      security: [{ cookieAuth: [] }],
    };

    const openapi = swaggerJsdoc({
      definition: openapiDefinition,
      apis: [
        './src/routes/**/*.js',
        './src/routes/*.js',
      ],
    });

    this.app.get('/openapi.json', (_req, res) => res.json(openapi));

    this.app.use('/docs', apiReference({
      url: '/openapi.json',
      theme: 'purple',
      layout: 'modern',
    }));
  }

  configureRoutes() {
    this.app.get('/', (_req, res) => {
      res.json({ message: 'Auth API funcionando' });
    });

    this.app.get('/favicon.ico', (_req, res) => res.status(204).end());

    new UsuarioRoutes(this.app);
    new RolRoutes(this.app);
    new PermisoRoutes(this.app);
    new RolPermisoRoutes(this.app);
    new UsuarioRolRoutes(this.app);
  }

  async connectDatabase() {
    try {
      await db.sequelize.sync({ alter: true });
      console.log('Base de datos conectada y sincronizada.');

      const tables = await db.sequelize.getQueryInterface().showAllTables();
      console.log('Tablas en la base de datos:', tables);
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
    }
  }

  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto ${this.port}`);
      console.log(`Docs: http://localhost:${this.port}/docs`);
    });

    server.requestTimeout = 30 * 1000;
    server.headersTimeout = 15 * 1000;
    server.keepAliveTimeout = 5 * 1000;
  }
}

const server = new Server();
server.start();
