const Sequelize = require('sequelize');
const dbConfig = require('../config/db.config.js');

class Database {
  constructor() {
    const sequelizeOptions = {
      host: dbConfig.HOST,
      port: dbConfig.PORT,
      dialect: dbConfig.dialect,
      pool: dbConfig.pool,
      logging: false
    };
    sequelizeOptions.dialectOptions = {
      ssl: {
        require: true,
      }
    }

    this._sequelize = dbConfig.DATABASE_URL
      ? new Sequelize(dbConfig.DATABASE_URL, sequelizeOptions)
      : new Sequelize(
        dbConfig.DB,
        dbConfig.USER,
        dbConfig.PASSWORD,
        sequelizeOptions
      );

    this.Sequelize = Sequelize;
    this.models = {};

    this._loadModels();
    this._associateModels();
  }

  _loadModels() {
    const sequelize = this._sequelize;

    // Cargar modelos
    this.models.Usuario = require('./Usuario.js')(sequelize);
    this.models.Rol = require('./Rol.js')(sequelize);
    this.models.Permiso = require('./Permiso.js')(sequelize);
    this.models.UsuarioRol = require('./UsuarioRol.js')(sequelize);
    this.models.RolPermiso = require('./RolPermiso.js')(sequelize);
    }


  _associateModels() {
    const { Usuario, Rol, Permiso, UsuarioRol, RolPermiso } = this.models;

    Usuario.hasMany(UsuarioRol, {
      foreignKey: 'usuarioId',
      as: 'usuario_roles',
      onDelete: 'CASCADE',
      hooks: true
    });
    UsuarioRol.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

    Usuario.belongsToMany(Rol, {
      through: UsuarioRol,
      foreignKey: 'usuarioId',
      as: 'roles',
      onDelete: 'CASCADE'
    });
    Rol.belongsToMany(Usuario, {
      through: UsuarioRol,
      foreignKey: 'rolId',
    });

    UsuarioRol.belongsTo(Rol, { foreignKey: 'rolId', as: 'rol' });
    Rol.hasMany(UsuarioRol, { foreignKey: 'rolId' });

    Rol.belongsToMany(Permiso, { through: RolPermiso, foreignKey: 'rolId', as: 'Permisos' });
    Permiso.belongsToMany(Rol, { through: RolPermiso, foreignKey: 'permisoId' });

    RolPermiso.belongsTo(Rol, { foreignKey: 'rolId', as: 'rol' });
    RolPermiso.belongsTo(Permiso, { foreignKey: 'permisoId', as: 'permiso' });


  }

  get sequelize() {
    return this._sequelize;
  }

  getModel(name) {
    return this.models[name];
  }
}

module.exports = new Database();
