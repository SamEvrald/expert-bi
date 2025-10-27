const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: true },
    role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'user' }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = function(models) {
    User.hasMany(models.Project, { foreignKey: 'userId', as: 'projects' });
    User.hasMany(models.Dataset, { foreignKey: 'userId', as: 'datasets' });
  };

  return User;
};