<template>
  <el-dialog
    v-model="visible"
    :title="previewData?.fileName || '文件预览'"
    width="800px"
    class="file-preview-dialog"
  >
    <div v-if="loading" class="preview-loading">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
    </div>
    
    <div v-else-if="previewData" class="preview-content">
      <!-- 图片预览 -->
      <div v-if="previewData.type === 'image'" class="image-preview">
        <img :src="previewData.preview" :alt="previewData.fileName" />
      </div>
      
      <!-- 文本预览 -->
      <div v-else-if="previewData.type === 'text'" class="text-preview">
        <pre>{{ previewData.preview }}</pre>
      </div>
      
      <!-- 二进制文件 -->
      <div v-else class="binary-preview">
        <el-empty description="该文件类型不支持预览">
          <template #image>
            <el-icon :size="80"><Document /></el-icon>
          </template>
        </el-empty>
      </div>
      
      <!-- 文件信息 -->
      <div class="file-meta">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名">
            {{ previewData.fileName }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatFileSize(previewData.fileSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            {{ previewData.fileExt }}
          </el-descriptions-item>
          <el-descriptions-item label="文件路径">
            {{ previewData.filePath }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fileApi } from '@/api'
import { formatFileSize } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  fileId: [Number, String]
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const previewData = ref(null)

watch(() => props.fileId, async (newId) => {
  if (newId && visible.value) {
    await loadPreview()
  }
})

watch(visible, async (newVal) => {
  if (newVal && props.fileId) {
    await loadPreview()
  }
})

const loadPreview = async () => {
  loading.value = true
  try {
    previewData.value = await fileApi.getFilePreview(props.fileId)
  } catch (error) {
    console.error('Failed to load preview:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.file-preview-dialog {
  .preview-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .preview-content {
    .image-preview {
      text-align: center;
      margin-bottom: 20px;
      
      img {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
      }
    }
    
    .text-preview {
      background-color: #f5f7fa;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 20px;
      max-height: 400px;
      overflow-y: auto;
      
      pre {
        margin: 0;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
    
    .binary-preview {
      padding: 40px 0;
    }
    
    .file-meta {
      margin-top: 20px;
    }
  }
}
</style>