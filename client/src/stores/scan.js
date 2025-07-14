/*
 * @Date: 2025-07-14 15:23:58
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scanApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useScanStore = defineStore('scan', () => {
  const isScanning = ref(false)
  const scanProgress = ref({
    status: 'idle',
    progress: 0,
    totalFiles: 0,
    processedFiles: 0
  })
  const currentTaskId = ref(null)
  const showProgressDialog = ref(false)
  
  let progressTimer = null
  
  async function startScan() {
    try {
      isScanning.value = true
      showProgressDialog.value = true
      
      const { taskId } = await scanApi.startScan()
      currentTaskId.value = taskId
      
      // 开始轮询进度
      pollProgress()
    } catch (error) {
      isScanning.value = false
      showProgressDialog.value = false
      ElMessage.error('启动扫描失败')
    }
  }
  
  async function pollProgress() {
    if (!currentTaskId.value) return
    
    try {
      const progress = await scanApi.getScanProgress(currentTaskId.value)
      scanProgress.value = progress
      
      if (progress.status === 'scanning') {
        // 继续轮询
        progressTimer = setTimeout(pollProgress, 1000)
      } else {
        // 扫描完成或失败
        isScanning.value = false
        if (progress.status === 'completed') {
          ElMessage.success('扫描完成')
          // 刷新文件列表
          const fileStore = useFileStore()
          fileStore.fetchDuplicateGroups()
          fileStore.fetchStatistics()
        } else {
          ElMessage.error('扫描失败')
        }
        
        // 3秒后自动关闭进度对话框
        setTimeout(() => {
          showProgressDialog.value = false
        }, 3000)
      }
    } catch (error) {
      isScanning.value = false
      clearTimeout(progressTimer)
    }
  }
  
  function stopPolling() {
    if (progressTimer) {
      clearTimeout(progressTimer)
      progressTimer = null
    }
  }
  
  return {
    isScanning,
    scanProgress,
    showProgressDialog,
    startScan,
    stopPolling
  }
})