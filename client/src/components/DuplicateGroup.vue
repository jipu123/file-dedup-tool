<template>
  <el-card class="duplicate-group-card">
    <div class="group-header">
      <div class="group-info">
        <el-icon :size="24"><component :is="fileIcon" /></el-icon>
        <div class="info-text">
          <div class="file-count">{{ group.file_count }} 个重复文件</div>
          <div class="file-size">文件大小: {{ formatFileSize(group.file_size) }}</div>
        </div>
      </div>
      <div class="group-actions">
        <el-button
          type="primary"
          size="small"
          @click="toggleExpand"
        >
          {{ isExpanded ? '收起' : '展开' }}
          <el-icon class="el-icon--right">
            <component :is="isExpanded ? 'ArrowUp' : 'ArrowDown'" />
          </el-icon>
        </el-button>
      </div>
    </div>
    
    <el-collapse-transition>
      <div v-show="isExpanded" class="file-list">
        <div
          v-for="file in group.files"
          :key="file.id"
          class="file-item"
          :class="{ selected: selectedFiles.includes(file.id) }"
          @click="toggleFileSelection(file.id)"
        >
          <el-checkbox
            :model-value="selectedFiles.includes(file.id)"
            @click.stop
            @change="toggleFileSelection(file.id)"
          />
          <div class="file-info">
            <div class="file-name">{{ file.file_name }}</div>
            <div class="file-path">{{ file.file_path }}</div>
          </div>
          <div class="file-actions">
            <el-button
              text
              type="primary"
              @click.stop="previewFile(file)"
            >
              预览
            </el-button>
          </div>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="batch-actions">
          <el-button
            type="primary"
            @click="showProcessDialog = true"
          >
            处理选中的文件 ({{ selectedFiles.length }})
          </el-button>
        </div>
      </div>
    </el-collapse-transition>
    
    <!-- 文件处理对话框 -->
    <FileOperationDialog
      v-model="showProcessDialog"
      :files="selectedFilesData"
      @success="handleProcessSuccess"
    />
    
    <!-- 文件预览对话框 -->
    <FilePreviewDialog
      v-model="showPreviewDialog"
      :file-id="previewFileId"
    />
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatFileSize } from '@/utils/format'
import { getFileTypeIcon } from '@/utils/format'
import FileOperationDialog from './FileOperationDialog.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['process'])

const isExpanded = ref(false)
const selectedFiles = ref([])
const showProcessDialog = ref(false)
const showPreviewDialog = ref(false)
const previewFileId = ref(null)

const fileIcon = computed(() => {
  const firstFile = props.group.files[0]
  return getFileTypeIcon(firstFile?.file_ext)
})

const selectedFilesData = computed(() => {
  return props.group.files.filter(f => selectedFiles.value.includes(f.id))
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const toggleFileSelection = (fileId) => {
  const index = selectedFiles.value.indexOf(fileId)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(fileId)
  }
}

const previewFile = (file) => {
  previewFileId.value = file.id
  showPreviewDialog.value = true
}

const handleProcessSuccess = () => {
  selectedFiles.value = []
  showProcessDialog.value = false
  emit('process')
}
</script>

<style lang="scss" scoped>
.duplicate-group-card {
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    .group-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .info-text {
        .file-count {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }
        
        .file-size {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }
  
  .file-list {
    margin-top: 16px;
    
    .file-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background-color: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background-color: #e6f1fd;
      }
      
      &.selected {
        background-color: #e6f1fd;
        border: 1px solid #409eff;
      }
      
      .file-info {
        flex: 1;
        margin-left: 12px;
        overflow: hidden;
        
        .file-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .file-path {
          font-size: 12px;
          color: #909399;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
    
    .batch-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
      text-align: center;
    }
  }
}
</style>