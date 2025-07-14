const path = require('path');
const { getPool } = require('../models/database');
const { safeCopyFile, cleanEmptyDirectories } = require('../utils/fileUtils');
const { getPathsConfig } = require('../config');
const logger = require('../utils/logger');

class FileService {
    /**
     * 获取重复文件组
     */
    async getDuplicateGroups(options = {}) {
        const { page = 1, pageSize = 20, minSize = 0, fileType } = options;
        const offset = (page - 1) * pageSize;
        const pool = getPool();

        let query = `
      SELECT file_hash, file_size, COUNT(*) as file_count
      FROM files
      WHERE file_size >= ?
    `;

        const params = [minSize];

        if (fileType) {
            query += ' AND file_ext = ?';
            params.push(fileType);
        }

        query += `
      GROUP BY file_hash, file_size
      HAVING file_count > 1
      ORDER BY file_size DESC
      LIMIT ? OFFSET ?
    `;

        params.push(pageSize, offset);

        const [groups] = await pool.query(query, params);

        // 获取每组的文件列表
        for (const group of groups) {
            const [files] = await pool.query(
                'SELECT id, file_path, file_name, file_ext FROM files WHERE file_hash = ? AND file_size = ?',
                [group.file_hash, group.file_size]
            );
            group.files = files;
            group.groupId = `${group.file_hash}_${group.file_size}`;
        }

        // 获取总数
        const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM (
        SELECT file_hash, file_size, COUNT(*) as file_count
        FROM files
        WHERE file_size >= ?
        ${fileType ? 'AND file_ext = ?' : ''}
        GROUP BY file_hash, file_size
        HAVING file_count > 1
      ) as duplicate_groups
    `, fileType ? [minSize, fileType] : [minSize]);

        return {
            total: countResult[0].total,
            groups
        };
    }

    /**
     * 获取文件详情
     */
    async getFileDetails(fileId) {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        if (rows.length === 0) {
            throw new Error('File not found');
        }

        return rows[0];
    }

    /**
     * 处理重复文件
     */
    async processFiles(fileIds, newFileName, targetPath) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 获取文件信息
            const [files] = await connection.query(
                'SELECT * FROM files WHERE id IN (?)',
                [fileIds]
            );

            if (files.length === 0) {
                throw new Error('No files found');
            }

            // 验证所有文件具有相同的哈希值
            const firstHash = files[0].file_hash;
            if (!files.every(f => f.file_hash === firstHash)) {
                throw new Error('Selected files have different hashes');
            }

            // 构建目标路径
            const outputPath = getPathsConfig().outputPath;
            const fullTargetPath = path.join(outputPath, targetPath, newFileName);

            // 复制第一个文件到目标位置
            await safeCopyFile(files[0].file_path, fullTargetPath);

            // 记录操作
            const originalPaths = files.map(f => f.file_path);
            await connection.query(
                `INSERT INTO completed_files 
        (file_path, file_name, file_size, file_hash, file_ext, original_paths) 
        VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    fullTargetPath,
                    newFileName,
                    files[0].file_size,
                    files[0].file_hash,
                    files[0].file_ext,
                    JSON.stringify(originalPaths)
                ]
            );

            // 删除原文件并清理空文件夹
            for (const file of files) {
                try {
                    await fs.unlink(file.file_path);
                    await cleanEmptyDirectories(path.dirname(file.file_path));
                } catch (error) {
                    logger.error(`Error deleting file ${file.file_path}:`, error);
                }
            }

            // 从files表中删除记录
            await connection.query(
                'DELETE FROM files WHERE id IN (?)',
                [fileIds]
            );

            // 记录操作日志
            await connection.query(
                `INSERT INTO operation_logs 
        (operation_type, user_action, affected_files, result_status) 
        VALUES (?, ?, ?, ?)`,
                [
                    'process_duplicates',
                    `Consolidated ${files.length} files to ${newFileName}`,
                    JSON.stringify(originalPaths),
                    'success'
                ]
            );

            await connection.commit();

            return {
                success: true,
                targetPath: fullTargetPath,
                processedCount: files.length
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 获取统计信息
     */
    async getStatistics() {
        const pool = getPool();

        const [totalResult] = await pool.query(
            'SELECT COUNT(*) as totalFiles, SUM(file_size) as totalSize FROM files'
        );

        const [duplicateResult] = await pool.query(`
      SELECT COUNT(*) as duplicateFiles, SUM(file_size) as duplicateSize
      FROM files
      WHERE (file_hash, file_size) IN (
        SELECT file_hash, file_size
        FROM files
        GROUP BY file_hash, file_size
        HAVING COUNT(*) > 1
      )
    `);

        const total = totalResult[0];
        const duplicate = duplicateResult[0];

        return {
            totalFiles: total.totalFiles || 0,
            duplicateFiles: duplicate.duplicateFiles || 0,
            totalSize: total.totalSize || 0,
            duplicateSize: duplicate.duplicateSize || 0,
            savedSpace: duplicate.duplicateSize ?
                duplicate.duplicateSize - (duplicate.duplicateSize / duplicate.duplicateFiles) : 0
        };
    }
}

module.exports = new FileService();
