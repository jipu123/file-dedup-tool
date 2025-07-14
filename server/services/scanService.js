const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../models/database');
const { scanDirectory, calculateFileHash } = require('../utils/fileUtils');
const { getPathsConfig, getScanConfig } = require('../config');
const logger = require('../utils/logger');

class ScanService {
  constructor() {
    this.scanTasks = new Map();
  }

  /**
   * 开始扫描任务
   */
  async startScan() {
    const taskId = `scan_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const task = {
      id: taskId,
      status: 'scanning',
      totalFiles: 0,
      processedFiles: 0,
      startTime: new Date()
    };
    
    this.scanTasks.set(taskId, task);
    
    // 在数据库中创建任务记录
    const pool = getPool();
    await pool.query(
      'INSERT INTO scan_tasks (id, status, start_time) VALUES (?, ?, ?)',
      [taskId, 'scanning', task.startTime]
    );
    
    // 异步执行扫描
    this.executeScan(taskId).catch(error => {
      logger.error(`Scan task ${taskId} failed:`, error);
      this.updateTaskStatus(taskId, 'failed', error.message);
    });
    
    return taskId;
  }

  /**
   * 执行扫描
   */
    async executeScan(taskId) {
    const pool = getPool();
    const pathsConfig = getPathsConfig();
    const scanConfig = getScanConfig();
    const task = this.scanTasks.get(taskId);
    
    try {
      // 清空现有文件记录
      await pool.query('TRUNCATE TABLE files');
      
      const fileBatch = [];
      
      // 添加默认配置以防止 scanConfig 为 undefined
      const defaultScanConfig = {
        batchSize: 100,
        chunkSize: 1024 * 1024,
        excludeDirs: ['node_modules', '.git', 'dist', 'build'],
        excludeFiles: ['.DS_Store', 'Thumbs.db'],
        maxFileSize: 1024 * 1024 * 1024
      };
      
      const actualScanConfig = scanConfig || defaultScanConfig;
      const batchSize = actualScanConfig.batchSize || 100;
      
      for (const scanPath of pathsConfig.scanPaths) {
        logger.info(`Scanning path: ${scanPath}`);
        
        for await (const file of scanDirectory(scanPath, actualScanConfig)) {
          task.totalFiles++;
          
          try {
            // 计算文件哈希
            const hash = await calculateFileHash(file.path, actualScanConfig.chunkSize);
            
            fileBatch.push([
              file.path,
              file.name,
              file.size,
              hash,
              file.ext
            ]);
            
            // 批量插入
            if (fileBatch.length >= batchSize) {
              await this.insertFileBatch(fileBatch);
              task.processedFiles += fileBatch.length;
              fileBatch.length = 0;
              
              // 更新进度
              await this.updateTaskProgress(taskId, task.processedFiles, task.totalFiles);
            }
          } catch (error) {
            logger.error(`Error processing file ${file.path}:`, error);
          }
        }
      }
      
      // 插入剩余文件
      if (fileBatch.length > 0) {
        await this.insertFileBatch(fileBatch);
        task.processedFiles += fileBatch.length;
      }
      
      // 扫描完成
      await this.updateTaskStatus(taskId, 'completed');
      task.status = 'completed';
      task.endTime = new Date();
      
      logger.info(`Scan task ${taskId} completed. Total files: ${task.totalFiles}`);
    } catch (error) {
      throw error;
    }
  }
  /**
   * 批量插入文件记录
   */
  async insertFileBatch(fileBatch) {
    const pool = getPool();
    const sql = 'INSERT INTO files (file_path, file_name, file_size, file_hash, file_ext) VALUES ?';
    await pool.query(sql, [fileBatch]);
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId, processedFiles, totalFiles) {
    const pool = getPool();
    await pool.query(
      'UPDATE scan_tasks SET processed_files = ?, total_files = ? WHERE id = ?',
      [processedFiles, totalFiles, taskId]
    );
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status, errorMessage = null) {
    const pool = getPool();
    const endTime = status === 'completed' || status === 'failed' ? new Date() : null;
    
    await pool.query(
      'UPDATE scan_tasks SET status = ?, end_time = ?, error_message = ? WHERE id = ?',
      [status, endTime, errorMessage, taskId]
    );
  }

  /**
   * 获取扫描进度
   */
  async getScanProgress(taskId) {
    const task = this.scanTasks.get(taskId);
    if (!task) {
      // 从数据库获取
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT * FROM scan_tasks WHERE id = ?',
        [taskId]
      );
      
      if (rows.length === 0) {
        throw new Error('Task not found');
      }
      
      return {
        status: rows[0].status,
        progress: rows[0].total_files > 0 
          ? Math.round((rows[0].processed_files / rows[0].total_files) * 100) 
          : 0,
        totalFiles: rows[0].total_files,
        processedFiles: rows[0].processed_files
      };
    }
    
    return {
      status: task.status,
      progress: task.totalFiles > 0 
        ? Math.round((task.processedFiles / task.totalFiles) * 100) 
        : 0,
      totalFiles: task.totalFiles,
      processedFiles: task.processedFiles
    };
  }
}

module.exports = new ScanService();
