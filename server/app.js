/*
 * @Date: 2025-07-14 15:18:07
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('express-async-errors');
const config = require('../config.json');
const logger = require('./utils/logger');
const routes = require('./routes');
const { initializeDatabase } = require('./models/database');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API路由
app.use('/api', routes);

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('Global error handler:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库连接
    await initializeDatabase();
    
    const port = process.env.PORT || config.server.port || 3000;
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
