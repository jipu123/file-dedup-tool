/*
 * @Date: 2025-07-14 15:21:31
 */
const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const fileController = require('../controllers/fileController');
const pathController = require('../controllers/pathController');

// 扫描相关路由
router.post('/scan/start', scanController.startScan.bind(scanController));
router.get('/scan/progress/:taskId', scanController.getScanProgress.bind(scanController));

// 文件相关路由
router.get('/files/duplicates', fileController.getDuplicateGroups.bind(fileController));
router.get('/files/preview/:fileId', fileController.getFilePreview.bind(fileController));
router.post('/files/process', fileController.processFiles.bind(fileController));
router.get('/files/statistics', fileController.getStatistics.bind(fileController));

// 路径相关路由
router.get('/paths/output-tree', pathController.getOutputTree.bind(pathController));
router.post('/paths/create-directory', pathController.createDirectory.bind(pathController));

module.exports = router;
