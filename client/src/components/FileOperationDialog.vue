<template>
  <el-dialog
    v-model="visible"
    title="处理重复文件"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="选中文件">
        <el-tag type="info">{{ files.length }} 个文件</el-tag>
      </el-form-item>
      
      <el-form-item label="新文件名" prop="newFileName">
        <el-input
          v-model="formData.newFileName"
          placeholder="请输入新文件名"
        />
      </el-form-item>
      
      <el-form-item label="目标路径" prop="targetPath">
        <el-input
          v-model="formData.targetPath"
          placeholder="例如: images/2024"
        >
          <template #append>
            <el-button @click="showPathSelector = true">
              选择
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item label="操作说明">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>系统将执行以下操作：</p>
            <ol style="margin: 10px 0 0 20px;">
              <li>复制第一个文件到目标位置并重命名</li>
              <li>删除所有原文件</li>
              <li>清理空文件夹</li>
            </ol>
          </template>
        </el-alert>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
    
    <!-- 路径选择器 -->
    <PathSelector
      v-model="showPathSelector"
      @select="handlePathSelect"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fileApi } from '@/api'
import PathSelector from './PathSelector.vue'

const props = defineProps({
  modelValue: Boolean,
  files: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)
const showPathSelector = ref(false)

const formData = reactive({
  newFileName: '',
  targetPath: ''
})

const rules = {
  newFileName: [
    { required: true, message: '请输入新文件名', trigger: 'blur' },
    { pattern: /^[^<>:"/\\|?*]+$/, message: '文件名包含非法字符', trigger: 'blur' }
  ],
  targetPath: [
    { required: true, message: '请选择目标路径', trigger: 'blur' }
  ]
}

const handlePathSelect = (path) => {
  formData.targetPath = path
  showPathSelector.value = false
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    const fileIds = props.files.map(f => f.id)
    await fileApi.processFiles({
      fileIds,
      newFileName: formData.newFileName,
      targetPath: formData.targetPath
    })
    
    ElMessage.success('文件处理成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error('文件处理失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  visible.value = false
}
</script>