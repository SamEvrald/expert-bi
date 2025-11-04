import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'expert_bi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export class Database {
  static async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  static async getConnection() {
    return await pool.getConnection();
  }

  static async close() {
    await pool.end();
  }
}

export { pool };
export default Database;