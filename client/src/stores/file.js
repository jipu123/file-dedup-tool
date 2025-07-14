/*
 * @Date: 2025-07-14 15:24:15
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fileApi } from '@/api'

export const useFileStore = defineStore('file', () => {
  const duplicateGroups = ref([])
  const totalGroups = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filters = ref({
    minSize: 0,
    fileType: ''
  })
  const statistics = ref({
    totalFiles: 0,
    duplicateFiles: 0,
    totalSize: 0,
    savedSpace: 0
  })
  const loading = ref(false)
  
  async function fetchDuplicateGroups() {
    loading.value = true
    try {
      const params = {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...filters.value
      }
      
      const result = await fileApi.getDuplicateGroups(params)
      duplicateGroups.value = result.groups
      totalGroups.value = result.total
    } catch (error) {
      console.error('Failed to fetch duplicate groups:', error)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchStatistics() {
    try {
      const stats = await fileApi.getStatistics()
      statistics.value = stats
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }
  
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1
  }
  
  function setPage(page) {
    currentPage.value = page
    fetchDuplicateGroups()
  }
  
  return {
    duplicateGroups,
    totalGroups,
    currentPage,
    pageSize,
    filters,
    statistics,
    loading,
    fetchDuplicateGroups,
    fetchStatistics,
    setFilters,
    setPage
  }
})