const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dataset = sequelize.define('Dataset', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    projectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: 'project_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    originalFilename: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'original_filename'
    },
    s3Key: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: 's3_key'
    },
    sizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'size_bytes'
    },
    rowCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'row_count'
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'processing', 'completed', 'failed'),
      allowNull: true,
      defaultValue: 'uploaded'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'datasets',
    timestamps: true,
    createdAt: 'created_at', // Map camelCase to snake_case
    updatedAt: 'updated_at', // Map camelCase to snake_case
    underscored: false
  });

  return Dataset;
};