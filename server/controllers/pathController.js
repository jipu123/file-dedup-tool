/*
 * @Date: 2025-07-14 15:21:16
 */
const fs = require('fs-extra');
const path = require('path');
const { getPathsConfig } = require('../config');
const { isPathSafe } = require('../utils/fileUtils');

class PathController {
  /**
   * 获取输出目录树结构
   */
  async getOutputTree(req, res) {
    try {
      const outputPath = getPathsConfig().outputPath;
      const tree = await this.buildDirectoryTree(outputPath);
      
      res.json({
        code: 200,
        message: 'success',
        data: tree
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 构建目录树
   */
  async buildDirectoryTree(dirPath, relativePath = '') {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    
    const node = {
      name,
      path: relativePath,
      type: 'directory',
      children: []
    };
    
    if (stats.isDirectory()) {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const entryRelativePath = path.join(relativePath, entry);
        const entryStats = await fs.stat(entryPath);
        
        if (entryStats.isDirectory()) {
          const childNode = await this.buildDirectoryTree(entryPath, entryRelativePath);
          node.children.push(childNode);
        }
      }
    }
    
    return node;
  }

  /**
   * 创建目录
   */
  async createDirectory(req, res) {
    try {
      const { parentPath, dirName } = req.body;
      const outputPath = getPathsConfig().outputPath;
      
      // 验证路径安全性
      if (!isPathSafe(parentPath, outputPath)) {
        return res.status(400).json({
          code: 400,
          message: '非法路径',
          data: null
        });
      }
      
      const fullPath = path.join(outputPath, parentPath, dirName);
      await fs.ensureDir(fullPath);
      
      res.json({
        code: 200,
        message: '目录创建成功',
        data: { path: path.join(parentPath, dirName) }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = new PathController();
