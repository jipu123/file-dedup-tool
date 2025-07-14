const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * 计算文件哈希值
 * @param {string} filePath - 文件路径
 * @param {number} chunkSize - 分块大小
 * @returns {Promise<string>} SHA256哈希值
 */
async function calculateFileHash(filePath, chunkSize = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
    
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * 递归扫描目录
 * @param {string} dirPath - 目录路径
 * @param {Object} options - 扫描选项
 * @returns {AsyncGenerator} 文件路径生成器
 */
async function* scanDirectory(dirPath, options = {}) {
  const {
    excludeExtensions = [],
    excludeFolders = [],
    minFileSize = 0,
    maxFileSize = -1
  } = options;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 检查是否需要排除该文件夹
        if (!excludeFolders.includes(entry.name)) {
          yield* scanDirectory(fullPath, options);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        // 检查文件扩展名
        if (excludeExtensions.includes(ext)) {
          continue;
        }
        
        // 检查文件大小
        const stats = await fs.stat(fullPath);
        if (stats.size < minFileSize) continue;
        if (maxFileSize > 0 && stats.size > maxFileSize) continue;
        
        yield {
          path: fullPath,
          name: entry.name,
          size: stats.size,
          ext: ext
        };
      }
    }
  } catch (error) {
    logger.error(`Error scanning directory ${dirPath}:`, error);
  }
}

/**
 * 清理空文件夹
 * @param {string} dirPath - 目录路径
 * @returns {Promise<boolean>} 是否删除了文件夹
 */
async function cleanEmptyDirectories(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    
    if (entries.length === 0) {
      await fs.rmdir(dirPath);
      logger.info(`Removed empty directory: ${dirPath}`);
      return true;
    }
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await cleanEmptyDirectories(fullPath);
      }
    }
    
    // 重新检查是否为空
    const remainingEntries = await fs.readdir(dirPath);
    if (remainingEntries.length === 0) {
      await fs.rmdir(dirPath);
      logger.info(`Removed empty directory: ${dirPath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error cleaning directory ${dirPath}:`, error);
    return false;
  }
}

/**
 * 安全的文件复制
 * @param {string} sourcePath - 源文件路径
 * @param {string} destPath - 目标文件路径
 */
async function safeCopyFile(sourcePath, destPath) {
  // 确保目标目录存在
  await fs.ensureDir(path.dirname(destPath));
  
  // 检查目标文件是否已存在
  if (await fs.pathExists(destPath)) {
    throw new Error(`Target file already exists: ${destPath}`);
  }
  
  // 复制文件
  await fs.copy(sourcePath, destPath, { preserveTimestamps: true });
}

/**
 * 验证路径安全性
 * @param {string} inputPath - 输入路径
 * @param {string} basePath - 基础路径
 * @returns {boolean} 路径是否安全
 */
function isPathSafe(inputPath, basePath) {
  const resolvedPath = path.resolve(basePath, inputPath);
  return resolvedPath.startsWith(path.resolve(basePath));
}

module.exports = {
  calculateFileHash,
  scanDirectory,
  cleanEmptyDirectories,
  safeCopyFile,
  isPathSafe
};
