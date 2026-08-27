const { Model, DataTypes } = require('sequelize');

class Permiso extends Model {
    //Getters
    get Nombre() {
        return this.nombre;
    }
    //Setters
    set Nombre(newNombre) {
        this.nombre = newNombre;
    }
}

module.exports = (sequelize) => {
  Permiso.init(
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'permiso',
      tableName: 'permisos',
      timestamps: true
    }
  );

  return Permiso;
};
