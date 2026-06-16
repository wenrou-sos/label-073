import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ReturnPage from '@/pages/ReturnPage.vue'
import ViolationPage from '@/pages/ViolationPage.vue'
import TransferPage from '@/pages/TransferPage.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardPage },
      { path: 'return', name: 'return', component: ReturnPage },
      { path: 'violation', name: 'violation', component: ViolationPage },
      { path: 'transfer', name: 'transfer', component: TransferPage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
