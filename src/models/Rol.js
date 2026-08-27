const { Model, DataTypes } = require('sequelize');

class Rol extends Model {
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
  Rol.init(
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'rol',
      tableName: 'roles',
      timestamps: true
    }
  );

  return Rol;
};
