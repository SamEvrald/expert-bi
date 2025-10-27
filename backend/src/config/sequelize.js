require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    define: {
      underscored: true
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  }
);

// helper to keep server code simple
async function testConnection() {
  try {
    await sequelize.authenticate();
    return { ok: true };
  } catch (err) {
    throw err;
  }
}

// Export both forms so existing require(...) usage works:
// - require('../config/sequelize') -> { sequelize, testConnection }
// - code that expects the instance directly will still work because callers
//   already handle config.sequelize vs config in models/index.js
module.exports = {
  sequelize,
  testConnection
};