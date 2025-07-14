<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <el-icon><Files /></el-icon>
          文件去重管理工具
        </h1>
        <div class="header-actions">
          <el-button 
            type="primary" 
            @click="startScan"
            :loading="scanStore.isScanning"
          >
            <el-icon><Search /></el-icon>
            开始扫描
          </el-button>
        </div>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="250px" class="app-aside">
        <div class="aside-section">
          <h3>统计信息</h3>
          <div class="stats-panel">
            <div class="stat-item">
              <div class="stat-label">总文件数</div>
              <div class="stat-value">{{ formatNumber(statistics.totalFiles) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">重复文件</div>
              <div class="stat-value">{{ formatNumber(statistics.duplicateFiles) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">占用空间</div>
              <div class="stat-value">{{ formatFileSize(statistics.totalSize) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">可节省空间</div>
              <div class="stat-value">{{ formatFileSize(statistics.savedSpace) }}</div>
            </div>
          </div>
        </div>
        
        <div class="aside-section">
          <h3>文件筛选</h3>
          <el-form label-position="top">
            <el-form-item label="最小文件大小">
              <el-input-number 
                v-model="filters.minSize" 
                :min="0"
                placeholder="字节"
              />
            </el-form-item>
            <el-form-item label="文件类型">
              <el-select v-model="filters.fileType" placeholder="全部类型" clearable>
                <el-option label="图片" value="image" />
                <el-option label="文档" value="document" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="applyFilters" block>
              应用筛选
            </el-button>
          </el-form>
        </div>
      </el-aside>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
    
    <!-- 扫描进度对话框 -->
    <ScanProgress />
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScanStore } from '@/stores/scan'
import { useFileStore } from '@/stores/file'
import ScanProgress from '@/components/ScanProgress.vue'
import { formatFileSize, formatNumber } from '@/utils/format'

const scanStore = useScanStore()
const fileStore = useFileStore()

const filters = ref({
  minSize: 0,
  fileType: ''
})

const statistics = computed(() => fileStore.statistics)

const startScan = () => {
  scanStore.startScan()
}

const applyFilters = () => {
  fileStore.setFilters(filters.value)
  fileStore.fetchDuplicateGroups()
}

onMounted(() => {
  fileStore.fetchStatistics()
  fileStore.fetchDuplicateGroups()
})
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 100;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20px;
  }
  
  .app-title {
    margin: 0;
    font-size: 24px;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.app-aside {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  
  .aside-section {
    margin-bottom: 30px;
    
    h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }
  }
  
  .stats-panel {
    .stat-item {
      padding: 10px 0;
      border-bottom: 1px solid #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 5px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.app-main {
  padding: 20px;
  overflow-y: auto;
}
</style>