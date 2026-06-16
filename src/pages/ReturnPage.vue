<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import type { Damage, DamageType, Order } from '@/types'
import { DAMAGE_TYPE_LABELS, DAMAGE_COST_MAP, ORDER_STATUS_LABELS } from '@/types'
import { Upload, Trash2, Check, ChevronRight, ChevronLeft, Car, X, Eye, FileText, Fuel, Gauge, AlertCircle } from 'lucide-vue-next'

const { storeActiveOrders, storeCompletedOrders, returnVehicle, estimateDamageCost } = useAppStore()

const activeTab = ref<'pending' | 'history'>('pending')
const step = ref(1)
const selectedOrder = ref<Order | null>(null)
const mileage = ref<number>(0)
const fuelLevel = ref<number>(80)
const damages = ref<Damage[]>([])
const pendingClickPos = ref<{ x: number; y: number } | null>(null)

const showDetailModal = ref(false)
const detailOrder = ref<Order | null>(null)

const steps = [
  { label: '选择订单', num: 1 },
  { label: '里程与油量', num: 2 },
  { label: '损伤检查', num: 3 },
]

const tabOptions = [
  { label: '待还车', value: 'pending' as const, count: computed(() => storeActiveOrders.value.length) },
  { label: '已还车历史', value: 'history' as const, count: computed(() => storeCompletedOrders.value.length) },
]

function selectOrder(order: Order) {
  selectedOrder.value = order
  step.value = 2
}

function viewOrderDetail(order: Order) {
  detailOrder.value = order
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailOrder.value = null
}

function goBack() {
  returnError.value = ''
  if (step.value === 2) {
    selectedOrder.value = null
    mileage.value = 0
    fuelLevel.value = 80
  }
  if (step.value === 3) {
    damages.value = []
  }
  step.value--
}

function goToStep3() {
  step.value = 3
}

function handleSvgClick(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  pendingClickPos.value = { x, y }
}

function addDamage(type: DamageType) {
  if (!pendingClickPos.value) return
  const id = 'dmg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
  damages.value.push({
    id,
    x: pendingClickPos.value.x,
    y: pendingClickPos.value.y,
    type,
    estimatedCost: DAMAGE_COST_MAP[type],
    description: DAMAGE_TYPE_LABELS[type],
  })
  pendingClickPos.value = null
}

function removeDamage(id: string) {
  damages.value = damages.value.filter((d) => d.id !== id)
}

const totalDamageCost = computed(() =>
  damages.value.reduce((sum, d) => sum + d.estimatedCost, 0)
)

const returnError = ref('')

function confirmReturn() {
  if (!selectedOrder.value) return
  const success = returnVehicle(selectedOrder.value.id, mileage.value, fuelLevel.value, damages.value)
  if (!success) {
    returnError.value = '还车失败：该车辆不属于当前门店，无法办理还车手续'
    return
  }
  returnError.value = ''
  selectedOrder.value = null
  mileage.value = 0
  fuelLevel.value = 80
  damages.value = []
  pendingClickPos.value = null
  step.value = 1
}

function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

const baseDailyRate = 300

function calculateRentalCost(order: Order): number {
  const days = getDaysDiff(order.pickupDate, order.actualReturnDate || order.returnDate)
  return days * baseDailyRate
}

function getTotalCost(order: Order): number {
  return calculateRentalCost(order) + (order.extraCharges || 0)
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Tab Switcher -->
    <div class="bg-white rounded-xl shadow-sm p-1.5 inline-flex gap-1">
      <button
        v-for="tab in tabOptions"
        :key="tab.value"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
          activeTab === tab.value
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100',
        ]"
        @click="activeTab = tab.value; step = 1"
      >
        {{ tab.label }}
        <span
          :class="[
            'px-2 py-0.5 rounded-full text-xs font-semibold',
            activeTab === tab.value
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 text-slate-600',
          ]"
        >{{ tab.count.value }}</span>
      </button>
    </div>

    <!-- Step Indicator (only show for pending tab) -->
    <div v-if="activeTab === 'pending'" class="flex items-center justify-center gap-0 bg-white rounded-xl p-5 shadow-sm">
      <template v-for="(s, i) in steps" :key="s.num">
        <div class="flex items-center">
          <div
            :class="[
              'flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors',
              step > s.num
                ? 'bg-green-500 text-white'
                : step === s.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500',
            ]"
          >
            <Check v-if="step > s.num" class="w-4 h-4" />
            <span v-else>{{ s.num }}</span>
          </div>
          <span
            :class="[
              'ml-2 text-sm font-medium',
              step >= s.num ? 'text-slate-800' : 'text-slate-400',
            ]"
          >{{ s.label }}</span>
        </div>
        <ChevronRight
          v-if="i < steps.length - 1"
          class="w-5 h-5 text-slate-300 mx-4"
        />
      </template>
    </div>

    <!-- Step 1: Select Order (Pending Returns) -->
    <div v-if="step === 1 && activeTab === 'pending'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800">待还车订单</h2>
        <p class="text-xs text-slate-400 mt-1">点击订单行选择要还车的订单</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th class="px-4 py-3 text-left font-medium">订单号</th>
              <th class="px-4 py-3 text-left font-medium">客户姓名</th>
              <th class="px-4 py-3 text-left font-medium">车牌号</th>
              <th class="px-4 py-3 text-left font-medium">车型</th>
              <th class="px-4 py-3 text-left font-medium">取车日期</th>
              <th class="px-4 py-3 text-left font-medium">应还日期</th>
              <th class="px-4 py-3 text-left font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in storeActiveOrders"
              :key="order.id"
              class="border-t border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
              @click="selectOrder(order)"
            >
              <td class="px-4 py-3 font-mono text-slate-700">{{ order.id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ order.customerName }}</td>
              <td class="px-4 py-3 font-mono text-slate-700">{{ order.plateNumber }}</td>
              <td class="px-4 py-3 text-slate-700">{{ order.vehicleModel }}</td>
              <td class="px-4 py-3 text-slate-500">{{ order.pickupDate }}</td>
              <td class="px-4 py-3 text-slate-500">{{ order.returnDate }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    order.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700',
                  ]"
                >{{ ORDER_STATUS_LABELS[order.status] }}</span>
              </td>
            </tr>
            <tr v-if="storeActiveOrders.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-slate-400">暂无待还车订单</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- History: Completed Returns Table -->
    <div v-if="activeTab === 'history'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800">已还车历史</h2>
        <p class="text-xs text-slate-400 mt-1">点击"查看详情"查看验车信息</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th class="px-4 py-3 text-left font-medium">订单号</th>
              <th class="px-4 py-3 text-left font-medium">客户姓名</th>
              <th class="px-4 py-3 text-left font-medium">车牌号</th>
              <th class="px-4 py-3 text-left font-medium">车型</th>
              <th class="px-4 py-3 text-left font-medium">取车日期</th>
              <th class="px-4 py-3 text-left font-medium">实际还车</th>
              <th class="px-4 py-3 text-left font-medium">额外费用</th>
              <th class="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in storeCompletedOrders"
              :key="order.id"
              class="border-t border-slate-50 hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3 font-mono text-slate-700">{{ order.id }}</td>
              <td class="px-4 py-3 text-slate-700">{{ order.customerName }}</td>
              <td class="px-4 py-3 font-mono text-slate-700">{{ order.plateNumber }}</td>
              <td class="px-4 py-3 text-slate-700">{{ order.vehicleModel }}</td>
              <td class="px-4 py-3 text-slate-500">{{ order.pickupDate }}</td>
              <td class="px-4 py-3 text-slate-500">{{ order.actualReturnDate }}</td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'text-sm font-semibold',
                    (order.extraCharges || 0) > 0 ? 'text-red-600' : 'text-slate-500',
                  ]"
                >
                  {{ (order.extraCharges || 0) > 0 ? '¥' + order.extraCharges : '无' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                  @click="viewOrderDetail(order)"
                >
                  <Eye class="w-3.5 h-3.5" />
                  查看详情
                </button>
              </td>
            </tr>
            <tr v-if="storeCompletedOrders.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-slate-400">暂无已还车记录</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Step 2: Mileage & Fuel -->
    <div v-if="step === 2" class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <Car class="w-5 h-5 text-blue-500" />
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ selectedOrder?.plateNumber }} · {{ selectedOrder?.vehicleModel }}</p>
            <p class="text-xs text-slate-400">客户：{{ selectedOrder?.customerName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Mileage -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">归还里程 (km)</label>
            <input
              v-model.number="mileage"
              type="number"
              min="0"
              placeholder="请输入当前里程数"
              class="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <!-- Fuel Level -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">油量/电量 ({{ fuelLevel }}%)</label>
            <input
              v-model.number="fuelLevel"
              type="range"
              min="0"
              max="100"
              class="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Photo Upload Zone -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">车辆照片上传</label>
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
            <Upload class="w-10 h-10 mb-3" />
            <p class="text-sm font-medium">点击或拖拽上传车辆照片</p>
            <p class="text-xs mt-1">支持 JPG、PNG 格式，最多5张</p>
          </div>
        </div>
      </div>

      <div class="flex justify-between">
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="w-4 h-4" />
          上一步
        </button>
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          @click="goToStep3"
        >
          下一步
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Step 3: Damage Inspection -->
    <div v-if="step === 3" class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <Car class="w-5 h-5 text-blue-500" />
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ selectedOrder?.plateNumber }} · {{ selectedOrder?.vehicleModel }}</p>
            <p class="text-xs text-slate-400">点击车辆示意图标记损伤位置</p>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          <!-- SVG Vehicle Top View -->
          <div class="flex-1 flex justify-center relative">
            <svg
              viewBox="0 0 400 600"
              class="w-full max-w-sm bg-slate-50 rounded-xl border border-slate-200 cursor-crosshair"
              @click="handleSvgClick"
            >
              <!-- Car Body -->
              <rect x="80" y="60" width="240" height="480" rx="60" ry="60" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />

              <!-- Windshield -->
              <path d="M120,140 L280,140 L260,200 L140,200 Z" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" />

              <!-- Rear Window -->
              <path d="M140,420 L260,420 L280,480 L120,480 Z" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" />

              <!-- Front Wheels -->
              <rect x="55" y="120" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
              <rect x="315" y="120" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />

              <!-- Rear Wheels -->
              <rect x="55" y="400" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
              <rect x="315" y="400" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />

              <!-- Center Line (roof hint) -->
              <line x1="200" y1="200" x2="200" y2="420" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="6,4" />

              <!-- Side Mirror Hints -->
              <rect x="60" y="155" width="20" height="12" rx="3" fill="#94a3b8" />
              <rect x="320" y="155" width="20" height="12" rx="3" fill="#94a3b8" />

              <!-- Headlights -->
              <ellipse cx="130" cy="80" rx="18" ry="10" fill="#fde68a" stroke="#fbbf24" stroke-width="1" />
              <ellipse cx="270" cy="80" rx="18" ry="10" fill="#fde68a" stroke="#fbbf24" stroke-width="1" />

              <!-- Tail Lights -->
              <rect x="110" y="510" width="30" height="12" rx="4" fill="#fca5a5" stroke="#ef4444" stroke-width="1" />
              <rect x="260" y="510" width="30" height="12" rx="4" fill="#fca5a5" stroke="#ef4444" stroke-width="1" />

              <!-- Damage Markers -->
              <g v-for="d in damages" :key="d.id">
                <circle :cx="(d.x / 100) * 400" :cy="(d.y / 100) * 600" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
                <text :x="(d.x / 100) * 400" :y="(d.y / 100) * 600 + 1" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="10" font-weight="bold">{{ damages.indexOf(d) + 1 }}</text>
              </g>
            </svg>

            <!-- Damage Type Popup -->
            <div
              v-if="pendingClickPos"
              class="absolute bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-10 min-w-[140px]"
              :style="{
                top: Math.min(pendingClickPos.y, 80) + '%',
                left: Math.min(pendingClickPos.x, 70) + '%',
              }"
            >
              <p class="text-xs font-semibold text-slate-700 mb-2">选择损伤类型</p>
              <div class="space-y-1">
                <button
                  v-for="(label, type) in DAMAGE_TYPE_LABELS"
                  :key="type"
                  class="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs hover:bg-blue-50 transition-colors"
                  @click="addDamage(type as DamageType)"
                >
                  <span class="text-slate-700">{{ label }}</span>
                  <span class="text-slate-400">¥{{ DAMAGE_COST_MAP[type as DamageType] }}</span>
                </button>
              </div>
              <button
                class="w-full mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 hover:text-slate-600"
                @click="pendingClickPos = null"
              >取消</button>
            </div>
          </div>

          <!-- Damage List -->
          <div class="lg:w-80 flex flex-col">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">损伤记录</h3>
            <div v-if="damages.length === 0" class="flex-1 flex items-center justify-center py-10 text-slate-400 text-sm">
              暂无损伤记录
            </div>
            <div v-else class="flex-1 space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="(d, idx) in damages"
                :key="d.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">{{ idx + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-700">{{ DAMAGE_TYPE_LABELS[d.type] }}</p>
                  <p class="text-xs text-slate-400">位置: {{ d.x.toFixed(1) }}%, {{ d.y.toFixed(1) }}%</p>
                </div>
                <span class="text-sm font-semibold text-red-600 shrink-0">¥{{ d.estimatedCost }}</span>
                <button
                  class="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  @click="removeDamage(d.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div v-if="damages.length > 0" class="mt-4 pt-4 border-t border-slate-200">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-600">损伤费用合计</span>
                <span class="text-xl font-bold text-red-600">¥{{ totalDamageCost }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="returnError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        {{ returnError }}
      </div>

      <div class="flex justify-between">
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          @click="goBack"
        >
          <ChevronLeft class="w-4 h-4" />
          上一步
        </button>
        <button
          class="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          @click="confirmReturn"
        >
          <Check class="w-4 h-4" />
          确认还车
        </button>
      </div>
    </div>

    <!-- Inspection Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && detailOrder"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="closeDetailModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">验车详情</h2>
                <p class="text-xs text-slate-400">订单号：{{ detailOrder.id }}</p>
              </div>
            </div>
            <button
              class="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              @click="closeDetailModal"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Order Info Card -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-slate-50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">客户信息</p>
                <p class="text-sm font-semibold text-slate-800">{{ detailOrder.customerName }}</p>
                <p class="text-xs text-slate-500">{{ detailOrder.customerPhone }}</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">车辆信息</p>
                <p class="text-sm font-semibold text-slate-800 font-mono">{{ detailOrder.plateNumber }}</p>
                <p class="text-xs text-slate-500">{{ detailOrder.vehicleModel }}</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">租期</p>
                <p class="text-sm font-semibold text-slate-800">{{ getDaysDiff(detailOrder.pickupDate, detailOrder.actualReturnDate || detailOrder.returnDate) }} 天</p>
                <p class="text-xs text-slate-500">{{ detailOrder.pickupDate }} ~ {{ detailOrder.actualReturnDate }}</p>
              </div>
            </div>

            <!-- Mileage & Fuel -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                <div class="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Gauge class="w-6 h-6" />
                </div>
                <div>
                  <p class="text-xs font-medium text-blue-600 mb-0.5">还车里程</p>
                  <p class="text-2xl font-bold text-blue-800">{{ detailOrder.returnMileage?.toLocaleString() || '-' }} <span class="text-sm font-normal text-blue-600">km</span></p>
                </div>
              </div>
              <div class="flex items-center gap-4 p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200">
                <div class="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                  <Fuel class="w-6 h-6" />
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium text-amber-600 mb-0.5">油量/电量</p>
                  <p class="text-2xl font-bold text-amber-800">{{ detailOrder.returnFuelLevel || 0 }}<span class="text-sm font-normal text-amber-600">%</span></p>
                  <div class="w-full bg-amber-200 rounded-full h-2 mt-2">
                    <div
                      class="bg-amber-500 h-2 rounded-full transition-all"
                      :style="{ width: (detailOrder.returnFuelLevel || 0) + '%' }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Damage Section -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <AlertCircle class="w-5 h-5 text-red-500" />
                <h3 class="text-sm font-semibold text-slate-800">损伤标记</h3>
                <span
                  v-if="(detailOrder.damages?.length || 0) > 0"
                  class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold"
                >
                  {{ detailOrder.damages?.length || 0 }} 处
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
                >
                  无新损伤
                </span>
              </div>

              <div class="flex flex-col lg:flex-row gap-6">
                <!-- SVG Vehicle Top View -->
                <div class="flex-1 flex justify-center relative">
                  <svg
                    viewBox="0 0 400 600"
                    class="w-full max-w-sm bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <!-- Car Body -->
                    <rect x="80" y="60" width="240" height="480" rx="60" ry="60" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
                    <!-- Windshield -->
                    <path d="M120,140 L280,140 L260,200 L140,200 Z" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" />
                    <!-- Rear Window -->
                    <path d="M140,420 L260,420 L280,480 L120,480 Z" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" />
                    <!-- Wheels -->
                    <rect x="55" y="120" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
                    <rect x="315" y="120" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
                    <rect x="55" y="400" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
                    <rect x="315" y="400" width="30" height="80" rx="8" ry="8" fill="#334155" stroke="#1e293b" stroke-width="1" />
                    <!-- Center Line -->
                    <line x1="200" y1="200" x2="200" y2="420" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="6,4" />
                    <!-- Mirrors -->
                    <rect x="60" y="155" width="20" height="12" rx="3" fill="#94a3b8" />
                    <rect x="320" y="155" width="20" height="12" rx="3" fill="#94a3b8" />
                    <!-- Headlights -->
                    <ellipse cx="130" cy="80" rx="18" ry="10" fill="#fde68a" stroke="#fbbf24" stroke-width="1" />
                    <ellipse cx="270" cy="80" rx="18" ry="10" fill="#fde68a" stroke="#fbbf24" stroke-width="1" />
                    <!-- Tail Lights -->
                    <rect x="110" y="510" width="30" height="12" rx="4" fill="#fca5a5" stroke="#ef4444" stroke-width="1" />
                    <rect x="260" y="510" width="30" height="12" rx="4" fill="#fca5a5" stroke="#ef4444" stroke-width="1" />

                    <!-- Damage Markers -->
                    <g v-for="d in detailOrder.damages" :key="d.id">
                      <circle :cx="(d.x / 100) * 400" :cy="(d.y / 100) * 600" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="3" />
                      <text :x="(d.x / 100) * 400" :y="(d.y / 100) * 600 + 1" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="10" font-weight="bold">{{ (detailOrder.damages?.indexOf(d) || 0) + 1 }}</text>
                    </g>
                  </svg>
                </div>

                <!-- Damage List -->
                <div class="lg:w-80 flex flex-col">
                  <h4 class="text-sm font-semibold text-slate-700 mb-3">损伤明细</h4>
                  <div v-if="!detailOrder.damages || detailOrder.damages.length === 0" class="flex-1 flex items-center justify-center py-10 text-slate-400 text-sm">
                    无新损伤记录
                  </div>
                  <div v-else class="flex-1 space-y-2 max-h-96 overflow-y-auto">
                    <div
                      v-for="(d, idx) in detailOrder.damages"
                      :key="d.id"
                      class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shrink-0">{{ idx + 1 }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-700">{{ DAMAGE_TYPE_LABELS[d.type] }}</p>
                        <p class="text-xs text-slate-400">位置: {{ d.x.toFixed(1) }}%, {{ d.y.toFixed(1) }}%</p>
                      </div>
                      <span class="text-sm font-semibold text-red-600 shrink-0">¥{{ d.estimatedCost }}</span>
                    </div>
                  </div>

                  <div v-if="detailOrder.damages && detailOrder.damages.length > 0" class="mt-4 pt-4 border-t border-slate-200">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-slate-600">损伤费用合计</span>
                      <span class="text-xl font-bold text-red-600">¥{{ detailOrder.extraCharges || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cost Breakdown -->
            <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div class="flex items-center gap-2 mb-4">
                <FileText class="w-5 h-5 text-slate-600" />
                <h3 class="text-sm font-semibold text-slate-800">费用明细</h3>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between py-2 border-b border-slate-200">
                  <span class="text-sm text-slate-600">基础租金</span>
                  <span class="text-sm text-slate-800 font-medium">¥{{ calculateRentalCost(detailOrder) }}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-200">
                  <span class="text-sm text-slate-600">租赁天数</span>
                  <span class="text-sm text-slate-800 font-medium">{{ getDaysDiff(detailOrder.pickupDate, detailOrder.actualReturnDate || detailOrder.returnDate) }} 天 × ¥{{ baseDailyRate }}/天</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-200">
                  <span class="text-sm text-slate-600">额外费用（含损伤）</span>
                  <span
                    :class="[
                      'text-sm font-semibold',
                      (detailOrder.extraCharges || 0) > 0 ? 'text-red-600' : 'text-slate-500',
                    ]"
                  >
                    {{ (detailOrder.extraCharges || 0) > 0 ? '¥' + detailOrder.extraCharges : '¥0' }}
                  </span>
                </div>
                <div class="flex items-center justify-between pt-3">
                  <span class="text-base font-bold text-slate-800">订单总计</span>
                  <span class="text-2xl font-bold text-blue-600">¥{{ getTotalCost(detailOrder) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              class="px-6 py-2.5 rounded-lg bg-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-300 transition-colors"
              @click="closeDetailModal"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
