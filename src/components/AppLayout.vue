<template>
  <div class="flex h-screen bg-slate-50">
    <aside
      :class="[
        'flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-56',
      ]"
    >
      <div class="flex items-center h-14 px-4 border-b border-slate-700">
        <Car class="w-6 h-6 text-blue-400 shrink-0" />
        <span v-if="!collapsed" class="ml-3 text-white font-semibold text-sm truncate">
          租车门店管理
        </span>
      </div>

      <nav class="flex-1 py-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center px-4 h-10 text-sm transition-colors',
            isActive(item.path)
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-800 hover:text-white',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!collapsed" class="ml-3 truncate">{{ item.label }}</span>
        </router-link>
      </nav>

      <button
        class="flex items-center justify-center h-10 border-t border-slate-700 hover:bg-slate-800 transition-colors"
        @click="collapsed = !collapsed"
      >
        <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0">
        <h1 class="text-lg font-semibold text-slate-800">{{ currentPageTitle }}</h1>
        <div class="flex items-center gap-3 text-sm text-slate-500">
          <span class="font-mono">{{ currentDate }}</span>
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            店长
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, RotateCcw, AlertTriangle, ArrowRightLeft, Car, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const collapsed = ref(false)

const navItems = [
  { path: '/', label: '运营仪表盘', icon: LayoutDashboard },
  { path: '/return', label: '还车管理', icon: RotateCcw },
  { path: '/violation', label: '违章管理', icon: AlertTriangle },
  { path: '/transfer', label: '调车管理', icon: ArrowRightLeft },
]

const currentPageTitle = computed(() => {
  const item = navItems.find((n) => n.path === route.path)
  return item?.label ?? '运营仪表盘'
})

const currentDate = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${y}-${m}-${day} 星期${weekDays[d.getDay()]}`
})

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
