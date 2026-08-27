const { Model, DataTypes } = require('sequelize');

class UsuarioRol extends Model {
    //Getters
    get UsuarioRol() {
        return `${this.usuarioId} - ${this.rolId}`;
    }
    //Setters
    set UsuarioId(newUsuarioId) {
        this.usuarioId = newUsuarioId;
    }
    set RolId(newRolId) {
        this.rolId = newRolId;
    }
    
}

module.exports = (sequelize) => {
  UsuarioRol.init(
    {
      usuarioId: {
        type: DataTypes.UUID,
        references: { model: 'usuarios', key: 'id' }
      },
      rolId: {
        type: DataTypes.INTEGER,
        references: { model: 'roles', key: 'id' }
      }
    },
    {
      sequelize,
      modelName: 'usuario_rol',
      tableName: 'usuario_rol',
      timestamps: true
    }
  );

  return UsuarioRol;
};
