const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'user_id' // Map camelCase to snake_case
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'deleted'),
      allowNull: false,
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at', // Map to snake_case
    updatedAt: 'updated_at', // Map to snake_case
    underscored: false
  });

  return Project;
};