const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Dataset = sequelize.define('Dataset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['text/csv', 'application/csv']]
    }
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  s3Url: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      isUrl: true
    }
  },
  status: {
    type: DataTypes.ENUM('uploading', 'processing', 'completed', 'error', 'deleted'),
    defaultValue: 'uploading',
    allowNull: false
  },
  rowCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  columnCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  analysisData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'datasets',
  indexes: [
    {
      fields: ['projectId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['s3Key']
    }
  ]
});

module.exports = Dataset;