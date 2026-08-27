const { Model, DataTypes } = require('sequelize');

class RolPermiso extends Model {
  //Getters
  get RolPermiso() {
    return `${this.rolId} - ${this.permisoId}`;
  }
  //Setters
  set RolId(newRolId) {
    this.rolId = newRolId;
  }
  set PermisoId(newPermisoId) {
    this.permisoId = newPermisoId;
  }
}

module.exports = (sequelize) => {
  RolPermiso.init(
    {
      rolId: {
        type: DataTypes.INTEGER,
        references: { model: 'roles', key: 'id' }
      },
      permisoId: {
        type: DataTypes.INTEGER,
        references: { model: 'permisos', key: 'id' }
      }
    },
    {
      sequelize,
      modelName: 'rol_permiso',
      tableName: 'rol_permiso',
      timestamps: true
    }
  );

  return RolPermiso;
};
