/*
 * @Date: 2025-07-14 15:19:36
 */
const mysql = require('mysql2/promise');
const { getDatabaseConfig } = require('../config');
const logger = require('../utils/logger');

let pool;

async function initializeDatabase() {
  try {
    const dbConfig = getDatabaseConfig();
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit || 10,
      queueLimit: 0
    });

    // 测试连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    logger.info('Database connection pool initialized');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
}

module.exports = {
  initializeDatabase,
  getPool
};
