/*
 * @Date: 2025-07-14 15:24:49
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

export function formatNumber(num) {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

export function getFileTypeIcon(ext) {
  const typeMap = {
    // 图片
    '.jpg': 'Picture',
    '.jpeg': 'Picture',
    '.png': 'Picture',
    '.gif': 'Picture',
    '.bmp': 'Picture',
    '.svg': 'Picture',
    // 文档
    '.doc': 'Document',
    '.docx': 'Document',
    '.pdf': 'Document',
    '.txt': 'Document',
    '.xls': 'Document',
    '.xlsx': 'Document',
    '.ppt': 'Document',
    '.pptx': 'Document',
    // 视频
    '.mp4': 'VideoPlay',
    '.avi': 'VideoPlay',
    '.mov': 'VideoPlay',
    '.wmv': 'VideoPlay',
    '.flv': 'VideoPlay',
    '.mkv': 'VideoPlay',
    // 音频
    '.mp3': 'Headset',
    '.wav': 'Headset',
    '.flac': 'Headset',
    '.aac': 'Headset',
    '.ogg': 'Headset',
    // 压缩文件
    '.zip': 'Files',
    '.rar': 'Files',
    '.7z': 'Files',
    '.tar': 'Files',
    '.gz': 'Files',
    // 代码
    '.js': 'Document',
    '.json': 'Document',
    '.html': 'Document',
    '.css': 'Document',
    '.py': 'Document',
    '.java': 'Document',
    '.cpp': 'Document',
    '.c': 'Document'
  }
  
  return typeMap[ext?.toLowerCase()] || 'Document'
}
