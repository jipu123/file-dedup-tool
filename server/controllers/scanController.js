/*
 * @Date: 2025-07-14 15:20:39
 */
const scanService = require('../services/scanService');

class ScanController {
  /**
   * 开始扫描
   */
  async startScan(req, res) {
    try {
      const taskId = await scanService.startScan();
      
      res.json({
        code: 200,
        message: '扫描任务已启动',
        data: { taskId }
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
   * 获取扫描进度
   */
  async getScanProgress(req, res) {
    try {
      const { taskId } = req.params;
      const progress = await scanService.getScanProgress(taskId);
      
      res.json({
        code: 200,
        message: 'success',
        data: progress
      });
    } catch (error) {
      res.status(404).json({
        code: 404,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = new ScanController();
