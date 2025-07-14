<!--
 * @Date: 2025-07-14 15:25:12
-->
<template>
  <div class="duplicate-files">
    <div class="page-header">
      <h2>重复文件组</h2>
      <el-text type="info">
        找到 {{ fileStore.totalGroups }} 组重复文件
      </el-text>
    </div>
    
    <div v-if="fileStore.loading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="fileStore.duplicateGroups.length === 0" class="empty-container">
      <el-empty description="暂无重复文件" />
    </div>
    
    <div v-else class="duplicate-groups">
      <DuplicateGroup
        v-for="group in fileStore.duplicateGroups"
        :key="group.groupId"
        :group="group"
        @process="handleProcessFiles"
      />
    </div>
    
    <div v-if="fileStore.totalGroups > fileStore.pageSize" class="pagination">
      <el-pagination
        v-model:current-page="fileStore.currentPage"
        :page-size="fileStore.pageSize"
        :total="fileStore.totalGroups"
        layout="total, prev, pager, next"
        @current-change="fileStore.setPage"
      />
    </div>
  </div>
</template>

<script setup>
import { useFileStore } from '@/stores/file'
import DuplicateGroup from '@/components/DuplicateGroup.vue'

const fileStore = useFileStore()

const handleProcessFiles = () => {
  // 处理完成后刷新列表
  fileStore.fetchDuplicateGroups()
  fileStore.fetchStatistics()
}
</script>

<style lang="scss" scoped>
.duplicate-files {
  .page-header {
    margin-bottom: 20px;
    
    h2 {
      margin: 0 0 10px 0;
      color: #303133;
    }
  }
  
  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: #909399;
  }
  
  .duplicate-groups {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
  }
}
</style>