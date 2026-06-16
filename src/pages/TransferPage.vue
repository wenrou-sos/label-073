<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import type { TransferRequest, Vehicle } from '@/types'
import { TRANSFER_STATUS_LABELS, VEHICLE_CATEGORIES } from '@/types'
import { stores } from '@/mock/data'
import { Plus, ArrowRight, Truck, CheckCircle, MapPin, Clock, User, FileText, X } from 'lucide-vue-next'

const {
  state,
  storeTransfers,
  isFromStore,
  isToStore,
  createTransferRequest,
  approveTransfer,
  shipTransfer,
  completeTransfer,
} = useAppStore()

type StatusFilter = 'all' | TransferRequest['status']

const activeFilter = ref<StatusFilter>('all')
const showNewModal = ref(false)
const showVehicleModal = ref(false)
const activeTransferId = ref('')
const transferError = ref('')

const newForm = ref({
  fromStoreId: '',
  vehicleCategory: '',
  remark: '',
})

const approveForm = ref({
  vehicleId: '',
  handler: '',
})

const filterTabs: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'approved' },
  { label: '运输中', value: 'in_transit' },
  { label: '已完成', value: 'completed' },
]

const filteredTransfers = computed(() => {
  if (activeFilter.value === 'all') return storeTransfers.value
  return storeTransfers.value.filter((t) => t.status === activeFilter.value)
})

const fromStoreOptions = computed(() =>
  stores.filter((s) => s.id !== state.currentStoreId)
)

const currentStore = computed(() =>
  stores.find((s) => s.id === state.currentStoreId)!
)

const availableVehicles = computed(() => {
  const transfer = storeTransfers.value.find((t) => t.id === activeTransferId.value)
  if (!transfer) return []
  return state.vehicles.filter(
    (v) =>
      v.storeId === transfer.fromStoreId &&
      v.category === transfer.vehicleCategory &&
      v.status === 'available'
  )
})

const statusColorMap: Record<TransferRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

const statusDotMap: Record<TransferRequest['status'], string> = {
  pending: 'bg-amber-500',
  approved: 'bg-blue-500',
  in_transit: 'bg-orange-500',
  completed: 'bg-green-500',
}

const timelineSteps: { key: keyof TransferRequest; label: string }[] = [
  { key: 'requestTime', label: '申请' },
  { key: 'approvedTime', label: '确认' },
  { key: 'arrivalTime', label: '到达' },
]

function getTimelineIndex(transfer: TransferRequest): number {
  if (transfer.status === 'completed') return 3
  if (transfer.status === 'in_transit') return 2
  if (transfer.status === 'approved') return 1
  return 0
}

function openNewModal() {
  newForm.value = { fromStoreId: '', vehicleCategory: '', remark: '' }
  showNewModal.value = true
}

function submitNewRequest() {
  if (!newForm.value.fromStoreId || !newForm.value.vehicleCategory) return
  const fromStore = stores.find((s) => s.id === newForm.value.fromStoreId)
  if (!fromStore) return
  createTransferRequest({
    fromStoreId: fromStore.id,
    fromStoreName: fromStore.name,
    toStoreId: state.currentStoreId,
    toStoreName: currentStore.value.name,
    vehicleCategory: newForm.value.vehicleCategory,
    remark: newForm.value.remark,
  })
  showNewModal.value = false
}

function openVehicleModal(transferId: string) {
  if (!isFromStore(transferId)) {
    transferError.value = '只有调出门店才能确认调车'
    return
  }
  transferError.value = ''
  activeTransferId.value = transferId
  approveForm.value = { vehicleId: '', handler: '' }
  showVehicleModal.value = true
}

function submitApprove() {
  if (!approveForm.value.vehicleId || !approveForm.value.handler.trim()) return
  const success = approveTransfer(activeTransferId.value, approveForm.value.vehicleId, approveForm.value.handler.trim())
  if (success) {
    showVehicleModal.value = false
    transferError.value = ''
  } else {
    transferError.value = '确认调车失败：权限不足或车辆信息有误'
  }
}

function handleShip(transferId: string) {
  if (!isFromStore(transferId)) {
    transferError.value = '只有调出门店才能执行发车操作'
    return
  }
  const success = shipTransfer(transferId)
  if (!success) {
    transferError.value = '发车失败：权限不足或状态有误'
  } else {
    transferError.value = ''
  }
}

function handleComplete(transferId: string) {
  if (!isToStore(transferId)) {
    transferError.value = '只有调入门店才能确认到达'
    return
  }
  const success = completeTransfer(transferId)
  if (!success) {
    transferError.value = '确认到达失败：权限不足或状态有误'
  } else {
    transferError.value = ''
  }
}

function closeNewModal() {
  showNewModal.value = false
}

function closeVehicleModal() {
  showVehicleModal.value = false
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div class="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="[
            'px-4 py-1.5 text-sm rounded-md transition-colors',
            activeFilter === tab.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100',
          ]"
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <button
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        @click="openNewModal"
      >
        <Plus class="w-4 h-4" />
        新建调车申请
      </button>
    </div>

    <div v-if="transferError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
      {{ transferError }}
    </div>

    <div v-if="filteredTransfers.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <Truck class="w-12 h-12 mb-3" />
      <p class="text-sm">暂无调车记录</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-for="transfer in filteredTransfers"
        :key="transfer.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
                statusColorMap[transfer.status],
              ]"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', statusDotMap[transfer.status]]"></span>
              {{ TRANSFER_STATUS_LABELS[transfer.status] }}
            </span>
            <span class="text-xs text-slate-400 font-mono">{{ transfer.id }}</span>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <div class="flex items-center gap-1.5 text-sm">
              <MapPin class="w-3.5 h-3.5 text-slate-400" />
              <span class="font-medium text-slate-700">{{ transfer.fromStoreName }}</span>
              <span v-if="isFromStore(transfer.id)" class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">调出方</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-300" />
            <div class="flex items-center gap-1.5 text-sm">
              <MapPin class="w-3.5 h-3.5 text-blue-400" />
              <span class="font-medium text-slate-700">{{ transfer.toStoreName }}</span>
              <span v-if="isToStore(transfer.id)" class="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">调入方</span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2 text-slate-600">
              <Truck class="w-3.5 h-3.5 text-slate-400" />
              <span>车型：{{ transfer.vehicleCategory }}</span>
            </div>
            <div v-if="transfer.vehiclePlateNumber" class="flex items-center gap-2 text-slate-600">
              <FileText class="w-3.5 h-3.5 text-slate-400" />
              <span>车牌：{{ transfer.vehiclePlateNumber }}</span>
            </div>
            <div v-if="transfer.handler" class="flex items-center gap-2 text-slate-600">
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>调度人：{{ transfer.handler }}</span>
            </div>
            <div v-if="transfer.remark" class="flex items-start gap-2 text-slate-500">
              <FileText class="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <span>{{ transfer.remark }}</span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-1">
              <template v-for="(step, i) in timelineSteps" :key="step.key">
                <div class="flex items-center gap-1">
                  <div class="flex flex-col items-center">
                    <div
                      :class="[
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors',
                        i < getTimelineIndex(transfer)
                          ? 'bg-green-500 border-green-500 text-white'
                          : i === getTimelineIndex(transfer) && transfer[step.key]
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : i === getTimelineIndex(transfer) && !transfer[step.key]
                          ? 'border-slate-300 bg-white text-slate-400'
                          : 'border-slate-200 bg-white text-slate-300',
                      ]"
                    >
                      <CheckCircle v-if="i < getTimelineIndex(transfer)" class="w-3 h-3" />
                      <template v-else>{{ i + 1 }}</template>
                    </div>
                    <span class="text-[10px] mt-0.5 text-slate-400">{{ step.label }}</span>
                  </div>
                </div>
                <div
                  v-if="i < timelineSteps.length - 1"
                  :class="[
                    'flex-1 h-0.5 mx-1 mt-[-12px]',
                    i < getTimelineIndex(transfer) - 1 || (i < getTimelineIndex(transfer))
                      ? 'bg-green-400'
                      : 'bg-slate-200',
                  ]"
                ></div>
              </template>
            </div>
            <div class="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
              <div v-if="transfer.requestTime" class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                <span>申请：{{ transfer.requestTime }}</span>
              </div>
              <div v-if="transfer.approvedTime" class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                <span>确认：{{ transfer.approvedTime }}</span>
              </div>
              <div v-if="transfer.arrivalTime" class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                <span>到达：{{ transfer.arrivalTime }}</span>
              </div>
            </div>
          </div>

          <div v-if="transfer.status !== 'completed'" class="mt-4 flex gap-2">
            <button
              v-if="transfer.status === 'pending' && isFromStore(transfer.id)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
              @click="openVehicleModal(transfer.id)"
            >
              <CheckCircle class="w-4 h-4" />
              确认调车
            </button>
            <div
              v-if="transfer.status === 'pending' && !isFromStore(transfer.id)"
              class="flex-1 flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-400 text-sm rounded-lg cursor-not-allowed"
            >
              待对方门店确认
            </div>
            <button
              v-if="transfer.status === 'approved' && isFromStore(transfer.id)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              @click="handleShip(transfer.id)"
            >
              <Truck class="w-4 h-4" />
              发车
            </button>
            <div
              v-if="transfer.status === 'approved' && !isFromStore(transfer.id)"
              class="flex-1 flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-400 text-sm rounded-lg cursor-not-allowed"
            >
              待对方门店发车
            </div>
            <button
              v-if="transfer.status === 'in_transit' && isToStore(transfer.id)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              @click="handleComplete(transfer.id)"
            >
              <CheckCircle class="w-4 h-4" />
              确认到达
            </button>
            <div
              v-if="transfer.status === 'in_transit' && !isToStore(transfer.id)"
              class="flex-1 flex items-center justify-center px-3 py-2 bg-slate-100 text-slate-400 text-sm rounded-lg cursor-not-allowed"
            >
              运输中
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showNewModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/40" @click="closeNewModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-slate-800">新建调车申请</h2>
            <button class="p-1 hover:bg-slate-100 rounded-lg transition-colors" @click="closeNewModal">
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">调出门店</label>
              <select
                v-model="newForm.fromStoreId"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>请选择调出门店</option>
                <option v-for="store in fromStoreOptions" :key="store.id" :value="store.id">
                  {{ store.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">调入门店</label>
              <div class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                {{ currentStore.name }}（当前门店）
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">车辆类别</label>
              <select
                v-model="newForm.vehicleCategory"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>请选择车辆类别</option>
                <option v-for="cat in VEHICLE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
              <textarea
                v-model="newForm.remark"
                rows="3"
                placeholder="请输入备注信息（选填）"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              class="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              @click="closeNewModal"
            >
              取消
            </button>
            <button
              :disabled="!newForm.fromStoreId || !newForm.vehicleCategory"
              :class="[
                'flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors',
                newForm.fromStoreId && newForm.vehicleCategory
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-300 cursor-not-allowed',
              ]"
              @click="submitNewRequest"
            >
              提交申请
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showVehicleModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/40" @click="closeVehicleModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-slate-800">确认调车 - 选择车辆</h2>
            <button class="p-1 hover:bg-slate-100 rounded-lg transition-colors" @click="closeVehicleModal">
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">选择车辆</label>
              <select
                v-model="approveForm.vehicleId"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>请选择可用车辆</option>
                <option v-for="v in availableVehicles" :key="v.id" :value="v.id">
                  {{ v.plateNumber }} - {{ v.model }}
                </option>
              </select>
              <p v-if="availableVehicles.length === 0" class="mt-1 text-xs text-red-500">
                该门店无此类可用车辆
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">调度人</label>
              <input
                v-model="approveForm.handler"
                type="text"
                placeholder="请输入调度人姓名"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              class="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              @click="closeVehicleModal"
            >
              取消
            </button>
            <button
              :disabled="!approveForm.vehicleId || !approveForm.handler.trim()"
              :class="[
                'flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors',
                approveForm.vehicleId && approveForm.handler.trim()
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-300 cursor-not-allowed',
              ]"
              @click="submitApprove"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
