<template>
  <el-dialog
    v-model="visible"
    title="选择目标路径"
    width="500px"
  >
    <div class="path-selector">
      <div class="current-path">
        <el-icon><FolderOpened /></el-icon>
        <span>{{ currentPath || '/' }}</span>
      </div>
      
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="path"
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <el-icon><Folder /></el-icon>
            <span>{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
      
      <div class="new-folder">
        <el-input
          v-model="newFolderName"
          placeholder="新建文件夹名称"
          @keyup.enter="createFolder"
        >
          <template #append>
            <el-button @click="createFolder">创建</el-button>
          </template>
        </el-input>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSelect">选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pathApi } from '@/api'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const treeRef = ref()
const treeData = ref([])
const currentPath = ref('')
const newFolderName = ref('')

const treeProps = {
  label: 'name',
  children: 'children'
}

onMounted(() => {
  loadTree()
})

const loadTree = async () => {
  try {
    const tree = await pathApi.getOutputTree()
    treeData.value = [tree]
  } catch (error) {
    console.error('Failed to load directory tree:', error)
  }
}

const handleNodeClick = (data) => {
  currentPath.value = data.path
}

const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }
  
  try {
    await pathApi.createDirectory({
      parentPath: currentPath.value || '',
      dirName: newFolderName.value
    })
    
    ElMessage.success('文件夹创建成功')
    newFolderName.value = ''
    await loadTree()
  } catch (error) {
    ElMessage.error('文件夹创建失败')
  }
}

const handleSelect = () => {
  emit('select', currentPath.value || '')
  visible.value = false
}
</script>

<style lang="scss" scoped>
.path-selector {
  .current-path {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 16px;
    font-weight: 500;
  }
  
  .el-tree {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 8px;
  }
  
  .tree-node {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .new-folder {
    margin-top: 16px;
  }
}
</style>