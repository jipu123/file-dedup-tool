const mysql = require('mysql2/promise');
const config = require('../../config.json');
const logger = require('../utils/logger');

async function initDatabase() {
  let connection;
  
  try {
    // 先连接MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password
    });

    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    logger.info(`Database ${config.database.database} created or already exists`);

    // 使用数据库
    await connection.query(`USE ${config.database.database}`);

    // 创建files表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash VARCHAR(64) NOT NULL,
        file_ext VARCHAR(50),
        scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_hash_size (file_hash, file_size),
        INDEX idx_size (file_size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    logger.info('Table "files" created');

    // 创建completed_files表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS completed_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash VARCHAR(64) NOT NULL,
        file_ext VARCHAR(50),
        process_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        original_paths TEXT COMMENT '原文件路径JSON数组',
        INDEX idx_hash_size (file_hash, file_size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    logger.info('Table "completed_files" created');

    // 创建operation_logs表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        operation_type VARCHAR(50) NOT NULL,
        user_action VARCHAR(100),
        affected_files TEXT,
        result_status VARCHAR(20),
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    logger.info('Table "operation_logs" created');

    // 创建scan_tasks表（用于跟踪扫描任务）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scan_tasks (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_files INT DEFAULT 0,
        processed_files INT DEFAULT 0,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        error_message TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    logger.info('Table "scan_tasks" created');

    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行初始化
if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = initDatabase;
