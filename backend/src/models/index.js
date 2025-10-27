const Sequelize = require('sequelize');
const config = require('../config/sequelize');

// support either `module.exports = sequelize` or `module.exports = { sequelize }`
const sequelize = (config && config.sequelize) ? config.sequelize : config;

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Project = require('./Project')(sequelize, Sequelize.DataTypes);
const Dataset = require('./Dataset')(sequelize, Sequelize.DataTypes);

const models = { User, Project, Dataset };

// call associate after all models are defined
Object.values(models).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = models;