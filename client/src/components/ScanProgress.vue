<!--
 * @Date: 2025-07-14 15:25:54
-->
<template>
  <el-dialog
    v-model="scanStore.showProgressDialog"
    title="扫描进度"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="scan-progress">
      <el-progress
        :percentage="scanStore.scanProgress.progress"
        :status="progressStatus"
      />
      
      <div class="progress-info">
        <div class="info-item">
          <span class="label">状态:</span>
          <span class="value">{{ statusText }}</span>
        </div>
        <div class="info-item">
          <span class="label">已处理:</span>
          <span class="value">
            {{ scanStore.scanProgress.processedFiles }} / {{ scanStore.scanProgress.totalFiles }}
          </span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useScanStore } from '@/stores/scan'

const scanStore = useScanStore()

const progressStatus = computed(() => {
  const status = scanStore.scanProgress.status
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  return ''
})

const statusText = computed(() => {
  const statusMap = {
    idle: '空闲',
    scanning: '扫描中',
    completed: '已完成',
    failed: '失败'
  }
  return statusMap[scanStore.scanProgress.status] || '未知'
})
</script>

<style lang="scss" scoped>
.scan-progress {
  .progress-info {
    margin-top: 20px;
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      
      .label {
        color: #909399;
      }
      
      .value {
        font-weight: 500;
        color: #303133;
      }
    }
  }
}
</style>