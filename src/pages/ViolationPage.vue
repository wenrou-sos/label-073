<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import type { Violation } from '@/types'
import { VIOLATION_STATUS_LABELS } from '@/types'
import { Plus, Filter, Send, CheckCircle, User, Phone, Loader } from 'lucide-vue-next'

const { state, matchViolation, notifyViolation, processViolation, completeViolation, addImportedViolations } = useAppStore()

type StatusFilter = 'all' | Violation['status']
const statusFilter = ref<StatusFilter>('all')
const showImportModal = ref(false)

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: VIOLATION_STATUS_LABELS.pending },
  { value: 'matched', label: VIOLATION_STATUS_LABELS.matched },
  { value: 'notified', label: VIOLATION_STATUS_LABELS.notified },
  { value: 'processing', label: VIOLATION_STATUS_LABELS.processing },
  { value: 'completed', label: VIOLATION_STATUS_LABELS.completed },
]

const filteredViolations = computed(() => {
  if (statusFilter.value === 'all') return state.violations
  return state.violations.filter((v) => v.status === statusFilter.value)
})

const statusBadgeClass: Record<Violation['status'], string> = {
  pending: 'bg-slate-100 text-slate-600',
  matched: 'bg-blue-100 text-blue-700',
  notified: 'bg-amber-100 text-amber-700',
  processing: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

const importForm = ref({
  plateNumber: '',
  violationTime: '',
  location: '',
  violationType: '',
  points: 0,
  fine: 0,
})

function resetImportForm() {
  importForm.value = { plateNumber: '', violationTime: '', location: '', violationType: '', points: 0, fine: 0 }
}

function handleImport() {
  const f = importForm.value
  if (!f.plateNumber || !f.violationTime || !f.location || !f.violationType) return
  addImportedViolations([
    {
      plateNumber: f.plateNumber,
      violationTime: f.violationTime,
      location: f.location,
      violationType: f.violationType,
      points: f.points,
      fine: f.fine,
    },
  ])
  const newViolation = state.violations[0]
  if (newViolation) {
    matchViolation(newViolation.id)
  }
  resetImportForm()
  showImportModal.value = false
}

const handlingMethodLabel: Record<Violation['handlingMethod'], string> = {
  self: '自行处理',
  agency: '门店代办',
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 flex-wrap">
        <Filter class="w-4 h-4 text-slate-400" />
        <button
          v-for="sf in statusFilters"
          :key="sf.value"
          :class="[
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            statusFilter === sf.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
          ]"
          @click="statusFilter = sf.value"
        >
          {{ sf.label }}
        </button>
      </div>
      <button
        class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        @click="showImportModal = true"
      >
        <Plus class="w-4 h-4" />
        导入违章
      </button>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-500 text-left">
            <th class="px-4 py-3 font-medium">车牌号</th>
            <th class="px-4 py-3 font-medium">违章时间</th>
            <th class="px-4 py-3 font-medium">违章地点</th>
            <th class="px-4 py-3 font-medium">违章类型</th>
            <th class="px-4 py-3 font-medium text-center">扣分</th>
            <th class="px-4 py-3 font-medium text-right">罚款</th>
            <th class="px-4 py-3 font-medium text-center">匹配状态</th>
            <th class="px-4 py-3 font-medium">租客信息</th>
            <th class="px-4 py-3 font-medium text-center">处理方式</th>
            <th class="px-4 py-3 font-medium text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in filteredViolations"
            :key="v.id"
            class="border-t border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-slate-800">{{ v.plateNumber }}</td>
            <td class="px-4 py-3 text-slate-600">{{ v.violationTime }}</td>
            <td class="px-4 py-3 text-slate-600">{{ v.location }}</td>
            <td class="px-4 py-3 text-slate-600">{{ v.violationType }}</td>
            <td class="px-4 py-3 text-center text-red-600 font-medium">{{ v.points }}</td>
            <td class="px-4 py-3 text-right text-red-600 font-medium">¥{{ v.fine }}</td>
            <td class="px-4 py-3 text-center">
              <span
                :class="[
                  'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                  statusBadgeClass[v.status],
                ]"
              >
                {{ VIOLATION_STATUS_LABELS[v.status] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <template v-if="v.matchedCustomer">
                <div class="flex items-center gap-1 text-slate-700">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  {{ v.matchedCustomer }}
                </div>
                <div class="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                  <Phone class="w-3 h-3" />
                  {{ v.matchedCustomerPhone }}
                </div>
              </template>
              <span v-else class="text-slate-300">-</span>
            </td>
            <td class="px-4 py-3 text-center text-slate-600">
              {{ v.status === 'pending' ? '-' : handlingMethodLabel[v.handlingMethod] }}
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-1.5">
                <button
                  v-if="v.status === 'pending'"
                  class="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  @click="matchViolation(v.id)"
                >
                  匹配订单
                </button>
                <button
                  v-if="v.status === 'matched'"
                  class="flex items-center gap-1 px-3 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  @click="notifyViolation(v.id)"
                >
                  <Send class="w-3 h-3" />
                  发送通知
                </button>
                <template v-if="v.status === 'notified'">
                  <button
                    class="px-3 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700 transition-colors"
                    @click="processViolation(v.id, 'self')"
                  >
                    自行处理
                  </button>
                  <button
                    class="px-3 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                    @click="processViolation(v.id, 'agency')"
                  >
                    门店代办
                  </button>
                </template>
                <button
                  v-if="v.status === 'processing'"
                  class="flex items-center gap-1 px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                  @click="completeViolation(v.id)"
                >
                  <CheckCircle class="w-3 h-3" />
                  标记完成
                </button>
                <span
                  v-if="v.status === 'completed'"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                >
                  <CheckCircle class="w-3 h-3" />
                  已完成
                </span>
              </div>
            </td>
          </tr>
          <tr v-if="filteredViolations.length === 0">
            <td colspan="10" class="px-4 py-12 text-center text-slate-400">
              暂无违章记录
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <teleport to="body">
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/40" @click="showImportModal = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-5">导入违章记录</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500 mb-1">车牌号</label>
                <input
                  v-model="importForm.plateNumber"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="京A12345"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-500 mb-1">违章时间</label>
                <input
                  v-model="importForm.violationTime"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2025-01-01 14:30"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm text-slate-500 mb-1">违章地点</label>
              <input
                v-model="importForm.location"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="朝阳区东三环主路"
              />
            </div>
            <div>
              <label class="block text-sm text-slate-500 mb-1">违章类型</label>
              <input
                v-model="importForm.violationType"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="超速行驶"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-slate-500 mb-1">扣分</label>
                <input
                  v-model.number="importForm.points"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-500 mb-1">罚款 (元)</label>
                <input
                  v-model.number="importForm.fine"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              @click="showImportModal = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              @click="handleImport"
            >
              导入
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
