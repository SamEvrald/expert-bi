const User = require('./User');
const Project = require('./Project');
const Dataset = require('./Dataset');

// Define associations
User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Dataset, { foreignKey: 'userId', as: 'datasets' });
Dataset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Dataset, { foreignKey: 'projectId', as: 'datasets' });
Dataset.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = {
  User,
  Project,
  Dataset
};