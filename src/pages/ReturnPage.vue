<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import type { Damage, DamageType, Order } from '@/types'
import { DAMAGE_TYPE_LABELS, DAMAGE_COST_MAP, ORDER_STATUS_LABELS } from '@/types'
import { Upload, Trash2, Check, ChevronRight, ChevronLeft, Car } from 'lucide-vue-next'

const { storeActiveOrders, returnVehicle, estimateDamageCost } = useAppStore()

const step = ref(1)
const selectedOrder = ref<Order | null>(null)
const mileage = ref<number>(0)
const fuelLevel = ref<number>(80)
const damages = ref<Damage[]>([])
const pendingClickPos = ref<{ x: number; y: number } | null>(null)

const steps = [
  { label: '选择订单', num: 1 },
  { label: '里程与油量', num: 2 },
  { label: '损伤检查', num: 3 },
]

function selectOrder(order: Order) {
  selectedOrder.value = order
  step.value = 2
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
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Step Indicator -->
    <div class="flex items-center justify-center gap-0 bg-white rounded-xl p-5 shadow-sm">
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

    <!-- Step 1: Select Order -->
    <div v-if="step === 1" class="bg-white rounded-xl shadow-sm overflow-hidden">
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
  </div>
</template>
