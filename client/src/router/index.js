/*
 * @Date: 2025-07-14 15:24:34
 */
import { createRouter, createWebHistory } from 'vue-router'
import DuplicateFiles from '@/views/DuplicateFiles.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DuplicateFiles
    }
  ]
})

export default router