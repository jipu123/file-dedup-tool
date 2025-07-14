const fileService = require('../services/fileService');
const path = require('path');
const fs = require('fs-extra');

class FileController {
  /**
   * 获取重复文件组
   */
  async getDuplicateGroups(req, res) {
    try {
      const { page, pageSize, minSize, fileType } = req.query;
      
      const result = await fileService.getDuplicateGroups({
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 20,
        minSize: parseInt(minSize) || 0,
        fileType
      });
      
      res.json({
        code: 200,
        message: 'success',
        data: result
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
   * 获取文件预览
   */
  async getFilePreview(req, res) {
    try {
      const { fileId } = req.params;
      const fileDetails = await fileService.getFileDetails(fileId);
      
      // 根据文件类型返回不同的预览信息
      const fileExt = fileDetails.file_ext.toLowerCase();
      const previewData = {
        id: fileDetails.id,
        fileName: fileDetails.file_name,
        fileSize: fileDetails.file_size,
        filePath: fileDetails.file_path,
        fileExt: fileExt
      };
      
      // 图片文件返回base64
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExt)) {
        try {
          const fileBuffer = await fs.readFile(fileDetails.file_path);
          const base64 = fileBuffer.toString('base64');
          previewData.preview = `data:image/${fileExt.slice(1)};base64,${base64}`;
          previewData.type = 'image';
        } catch (error) {
          previewData.error = 'Failed to read image file';
        }
      }
      // 文本文件返回前1000个字符
      else if (['.txt', '.log', '.md', '.json', '.xml', '.csv'].includes(fileExt)) {
        try {
          const content = await fs.readFile(fileDetails.file_path, 'utf8');
          previewData.preview = content.slice(0, 1000);
          previewData.type = 'text';
        } catch (error) {
          previewData.error = 'Failed to read text file';
        }
      }
      // 其他文件只返回基本信息
      else {
        previewData.type = 'binary';
        previewData.preview = null;
      }
      
      res.json({
        code: 200,
        message: 'success',
        data: previewData
      });
    } catch (error) {
      res.status(404).json({
        code: 404,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * 处理重复文件
   */
  async processFiles(req, res) {
    try {
      const { fileIds, newFileName, targetPath } = req.body;
      
      // 验证参数
      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要处理的文件',
          data: null
        });
      }
      
      if (!newFileName || !targetPath) {
        return res.status(400).json({
          code: 400,
          message: '请提供新文件名和目标路径',
          data: null
        });
      }
      
      const result = await fileService.processFiles(fileIds, newFileName, targetPath);
      
      res.json({
        code: 200,
        message: '文件处理成功',
        data: result
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
   * 获取统计信息
   */
  async getStatistics(req, res) {
    try {
      const stats = await fileService.getStatistics();
      
      res.json({
        code: 200,
        message: 'success',
        data: stats
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

module.exports = new FileController();
