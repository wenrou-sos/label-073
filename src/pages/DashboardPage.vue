<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        :class="[
          'bg-white rounded-lg shadow-sm p-5 border-l-4',
          card.alert ? 'border-red-500' : 'border-transparent',
        ]"
      >
        <div class="flex items-center justify-between">
          <span
            :class="[
              'font-mono text-3xl font-bold',
              card.alert ? 'text-red-600' : 'text-slate-800',
            ]"
          >{{ card.value }}</span>
          <component :is="card.icon" :class="['w-8 h-8', card.alert ? 'text-red-400' : 'text-slate-400']" />
        </div>
        <p class="mt-2 text-sm text-slate-500">{{ card.label }}</p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200">
        <h2 class="text-base font-semibold text-slate-800">车辆类别可用性 (7日)</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50">
              <th class="px-4 py-3 text-left text-slate-600 font-medium sticky left-0 bg-slate-50 z-10 min-w-[80px]">
                类别
              </th>
              <th
                v-for="day in dateColumns"
                :key="day.date"
                :class="[
                  'px-4 py-3 text-center font-medium min-w-[100px]',
                  day.isToday ? 'text-blue-600' : 'text-slate-600',
                ]"
              >
                <div>{{ day.label }}</div>
                <div v-if="day.isToday" class="text-xs text-blue-500">今天</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="category in VEHICLE_CATEGORIES"
              :key="category"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-white z-10">
                {{ category }}
              </td>
              <td
                v-for="day in dateColumns"
                :key="day.date"
                class="px-2 py-2 text-center cursor-pointer transition-colors hover:opacity-80"
                @click="openDrawer(category, day.date, day.label)"
              >
                <div
                  :class="[
                    'rounded-md py-3 px-2',
                    cellBgClass(category, day.date),
                  ]"
                >
                  <div
                    :class="[
                      'text-lg font-bold font-mono',
                      cellTextClass(category, day.date),
                    ]"
                  >
                    {{ getAvailability(category, day.date).available }}
                  </div>
                  <div class="text-xs mt-0.5 opacity-70">
                    共{{ getAvailability(category, day.date).total }}辆
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawerOpen" class="fixed inset-0 z-50" @click.self="closeDrawer">
          <div class="absolute inset-0 bg-black/30" @click="closeDrawer" />
          <div
            class="absolute right-0 top-0 bottom-0 w-[420px] bg-white shadow-xl flex flex-col"
          >
            <div class="flex items-center justify-between px-5 h-14 border-b border-slate-200 shrink-0">
              <div>
                <h3 class="font-semibold text-slate-800">{{ drawerCategory }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">{{ drawerDateLabel }} 订单列表</p>
              </div>
              <button
                class="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                @click="closeDrawer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
              <div v-if="drawerOrders.length === 0" class="text-center py-12 text-slate-400">
                <Package class="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>暂无订单</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="order in drawerOrders"
                  :key="order.id"
                  class="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-slate-800">{{ order.customerName }}</span>
                    <span
                      :class="[
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        statusBadgeClass(order.status),
                      ]"
                    >
                      {{ ORDER_STATUS_LABELS[order.status] }}
                    </span>
                  </div>
                  <div class="mt-2 text-xs text-slate-500 space-y-1">
                    <div class="flex items-center gap-1.5">
                      <Car class="w-3.5 h-3.5" />
                      <span>{{ order.plateNumber }} · {{ order.vehicleModel }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-3.5 text-center">📅</span>
                      <span>{{ order.pickupDate }} ~ {{ order.returnDate }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="w-3.5 text-center">📱</span>
                      <span>{{ order.customerPhone }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Car, RotateCcw, AlertTriangle, Package, X } from 'lucide-vue-next'
import { useAppStore } from '@/composables/useAppStore'
import type { Order } from '@/types'
import { VEHICLE_CATEGORIES, ORDER_STATUS_LABELS } from '@/types'

const store = useAppStore()

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function generateDateColumns() {
  const columns: { date: string; label: string; isToday: boolean }[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    columns.push({
      date: `${d.getFullYear()}-${mm}-${dd}`,
      label: `${mm}/${dd} ${WEEK_DAYS[d.getDay()]}`,
      isToday: i === 0,
    })
  }
  return columns
}

const dateColumns = generateDateColumns()

const kpiCards = computed(() => [
  {
    label: '今日应取车辆数',
    value: store.todayPickupCount.value,
    icon: Car,
    alert: false,
  },
  {
    label: '今日应还车辆数',
    value: store.todayReturnCount.value,
    icon: RotateCcw,
    alert: false,
  },
  {
    label: '当前在库可用车辆',
    value: store.availableVehicleCount.value,
    icon: Package,
    alert: false,
  },
  {
    label: '待处理违章数',
    value: store.pendingViolationCount.value,
    icon: AlertTriangle,
    alert: store.pendingViolationCount.value > 5,
  },
])

function getAvailability(category: string, date: string) {
  return store.getCategoryAvailability(category, date)
}

function cellBgClass(category: string, date: string): string {
  const { available } = getAvailability(category, date)
  if (available === 0) return 'bg-red-100'
  if (available <= 2) return 'bg-amber-100'
  return 'bg-green-100'
}

function cellTextClass(category: string, date: string): string {
  const { available } = getAvailability(category, date)
  if (available === 0) return 'text-red-700'
  if (available <= 2) return 'text-amber-700'
  return 'text-green-700'
}

const drawerOpen = ref(false)
const drawerCategory = ref('')
const drawerDateLabel = ref('')
const drawerDate = ref('')
const drawerOrders = ref<Order[]>([])

function openDrawer(category: string, date: string, label: string) {
  drawerCategory.value = category
  drawerDate.value = date
  drawerDateLabel.value = label
  drawerOrders.value = store.getOrdersForCategoryDate(category, date)
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function statusBadgeClass(status: Order['status']): string {
  switch (status) {
    case 'reserved':
      return 'bg-blue-100 text-blue-700'
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    case 'returned':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-active .absolute.right-0,
.drawer-leave-active .absolute.right-0 {
  transition: transform 0.25s ease;
}
.drawer-enter-from .absolute.right-0 {
  transform: translateX(100%);
}
.drawer-leave-to .absolute.right-0 {
  transform: translateX(100%);
}
</style>
