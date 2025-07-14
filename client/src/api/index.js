/*
 * @Date: 2025-07-14 15:23:44
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

// API接口
export const scanApi = {
  startScan: () => request.post('/scan/start'),
  getScanProgress: (taskId) => request.get(`/scan/progress/${taskId}`)
}

export const fileApi = {
  getDuplicateGroups: (params) => request.get('/files/duplicates', { params }),
  getFilePreview: (fileId) => request.get(`/files/preview/${fileId}`),
  processFiles: (data) => request.post('/files/process', data),
  getStatistics: () => request.get('/files/statistics')
}

export const pathApi = {
  getOutputTree: () => request.get('/paths/output-tree'),
  createDirectory: (data) => request.post('/paths/create-directory', data)
}
