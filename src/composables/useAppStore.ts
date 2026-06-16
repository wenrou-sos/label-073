import { reactive, computed } from 'vue'
import type { Vehicle, Order, Violation, TransferRequest, Damage, DamageType } from '@/types'
import { DAMAGE_COST_MAP } from '@/types'
import { vehicles as initVehicles, orders as initOrders, violations as initViolations, transferRequests as initTransfers, CURRENT_STORE_ID } from '@/mock/data'

const state = reactive({
  vehicles: [...initVehicles] as Vehicle[],
  orders: [...initOrders] as Order[],
  violations: [...initViolations] as Violation[],
  transfers: [...initTransfers] as TransferRequest[],
  currentStoreId: CURRENT_STORE_ID,
})

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const today = formatDate(new Date())

export function useAppStore() {
  const storeVehicles = computed(() =>
    state.vehicles.filter((v) => v.storeId === state.currentStoreId)
  )

  const todayPickupCount = computed(() =>
    state.orders
      .filter((o) => o.pickupDate === today && o.status === 'reserved')
      .filter((o) => {
        const v = state.vehicles.find((veh) => veh.id === o.vehicleId)
        return v && v.storeId === state.currentStoreId
      }).length
  )

  const todayReturnCount = computed(() =>
    state.orders
      .filter((o) => o.returnDate === today && (o.status === 'active' || o.status === 'overdue'))
      .filter((o) => {
        const v = state.vehicles.find((veh) => veh.id === o.vehicleId)
        return v && v.storeId === state.currentStoreId
      }).length
  )

  const availableVehicleCount = computed(() =>
    storeVehicles.value.filter((v) => v.status === 'available').length
  )

  const pendingViolationCount = computed(() =>
    state.violations
      .filter((v) => v.status !== 'completed')
      .filter((vio) => {
        const v = state.vehicles.find((veh) => veh.plateNumber === vio.plateNumber)
        return v && v.storeId === state.currentStoreId
      }).length
  )

  const activeOrders = computed(() =>
    state.orders.filter((o) => o.status === 'active' || o.status === 'overdue')
  )

  const storeActiveOrders = computed(() =>
    activeOrders.value.filter((o) => {
      const vehicle = state.vehicles.find((v) => v.id === o.vehicleId)
      return vehicle && vehicle.storeId === state.currentStoreId
    })
  )

  const completedOrders = computed(() =>
    state.orders.filter((o) => o.status === 'returned')
  )

  const storeCompletedOrders = computed(() =>
    completedOrders.value.filter((o) => {
      const vehicle = state.vehicles.find((v) => v.id === o.vehicleId)
      return vehicle && vehicle.storeId === state.currentStoreId
    })
  )

  function getCategoryAvailability(category: string, date: string): { total: number; available: number; reserved: number } {
    const allVehicles = state.vehicles.filter(
      (v) => v.category === category && v.storeId === state.currentStoreId
    )
    const total = allVehicles.length
    const vehicleIds = allVehicles.map((v) => v.id)
    const reservedOnDate = state.orders.filter(
      (o) =>
        vehicleIds.includes(o.vehicleId) &&
        o.status !== 'returned' &&
        o.pickupDate <= date &&
        o.returnDate >= date
    ).length
    const currentlyRented = allVehicles.filter((v) => v.status === 'rented').length
    const inMaintenance = allVehicles.filter((v) => v.status === 'maintenance').length
    const available = total - Math.max(reservedOnDate, currentlyRented) - inMaintenance
    return { total, available: Math.max(0, available), reserved: reservedOnDate }
  }

  function getOrdersForCategoryDate(category: string, date: string): Order[] {
    const categoryVehicles = state.vehicles.filter(
      (v) => v.category === category && v.storeId === state.currentStoreId
    )
    const vehicleIds = categoryVehicles.map((v) => v.id)
    return state.orders.filter(
      (o) =>
        vehicleIds.includes(o.vehicleId) &&
        o.status !== 'returned' &&
        o.pickupDate <= date &&
        o.returnDate >= date
    )
  }

  function returnVehicle(
    orderId: string,
    mileage: number,
    fuelLevel: number,
    damages: Damage[]
  ): boolean {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return false

    const vehicle = state.vehicles.find((v) => v.id === order.vehicleId)
    if (!vehicle || vehicle.storeId !== state.currentStoreId) {
      return false
    }

    const totalDamageCost = damages.reduce((sum, d) => sum + d.estimatedCost, 0)

    order.status = 'returned'
    order.actualReturnDate = formatDate(new Date())
    order.returnMileage = mileage
    order.returnFuelLevel = fuelLevel
    order.damages = damages
    order.extraCharges = totalDamageCost

    vehicle.status = 'available'
    vehicle.currentMileage = mileage
    vehicle.fuelLevel = fuelLevel

    return true
  }

  function addDamageToOrder(orderId: string, damage: Damage): number {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return 0
    order.damages.push(damage)
    order.extraCharges = order.damages.reduce((sum, d) => sum + d.estimatedCost, 0)
    return order.extraCharges
  }

  function removeDamageFromOrder(orderId: string, damageId: string) {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return
    order.damages = order.damages.filter((d) => d.id !== damageId)
    order.extraCharges = order.damages.reduce((sum, d) => sum + d.estimatedCost, 0)
  }

  function estimateDamageCost(type: DamageType): number {
    return DAMAGE_COST_MAP[type]
  }

  function matchViolation(violationId: string) {
    const violation = state.violations.find((v) => v.id === violationId)
    if (!violation || violation.status !== 'pending') return

    const matchedOrder = state.orders.find(
      (o) =>
        o.plateNumber === violation.plateNumber &&
        o.status !== 'returned' &&
        o.pickupDate <= violation.violationTime.slice(0, 10) &&
        o.returnDate >= violation.violationTime.slice(0, 10)
    )

    if (matchedOrder) {
      violation.matchedOrderId = matchedOrder.id
      violation.matchedCustomer = matchedOrder.customerName
      violation.matchedCustomerPhone = matchedOrder.customerPhone
      violation.status = 'matched'
    }
  }

  function notifyViolation(violationId: string) {
    const violation = state.violations.find((v) => v.id === violationId)
    if (!violation) return
    if (violation.status === 'matched' || violation.status === 'pending') {
      violation.status = 'notified'
    }
  }

  function processViolation(violationId: string, method: 'self' | 'agency') {
    const violation = state.violations.find((v) => v.id === violationId)
    if (!violation) return
    violation.handlingMethod = method
    violation.status = 'processing'
  }

  function completeViolation(violationId: string) {
    const violation = state.violations.find((v) => v.id === violationId)
    if (!violation) return
    violation.status = 'completed'
  }

  function createTransferRequest(req: {
    fromStoreId: string
    fromStoreName: string
    toStoreId: string
    toStoreName: string
    vehicleCategory: string
    remark: string
  }) {
    const tf: TransferRequest = {
      id: 'tf-' + String(state.transfers.length + 1).padStart(3, '0'),
      fromStoreId: req.fromStoreId,
      fromStoreName: req.fromStoreName,
      toStoreId: req.toStoreId,
      toStoreName: req.toStoreName,
      vehicleCategory: req.vehicleCategory,
      vehicleId: '',
      vehiclePlateNumber: '',
      status: 'pending',
      requestTime: formatDate(new Date()) + ' ' + new Date().toTimeString().slice(0, 5),
      approvedTime: '',
      arrivalTime: '',
      handler: '',
      remark: req.remark,
    }
    state.transfers.unshift(tf)
  }

  const storeTransfers = computed(() =>
    state.transfers.filter(
      (t) => t.fromStoreId === state.currentStoreId || t.toStoreId === state.currentStoreId
    )
  )

  function isFromStore(transferId: string): boolean {
    const tf = state.transfers.find((t) => t.id === transferId)
    return tf ? tf.fromStoreId === state.currentStoreId : false
  }

  function isToStore(transferId: string): boolean {
    const tf = state.transfers.find((t) => t.id === transferId)
    return tf ? tf.toStoreId === state.currentStoreId : false
  }

  function approveTransfer(transferId: string, vehicleId: string, handler: string): boolean {
    const tf = state.transfers.find((t) => t.id === transferId)
    if (!tf || tf.status !== 'pending') return false
    if (tf.fromStoreId !== state.currentStoreId) return false
    const vehicle = state.vehicles.find((v) => v.id === vehicleId)
    if (!vehicle || vehicle.storeId !== state.currentStoreId) return false

    tf.status = 'approved'
    tf.approvedTime = formatDate(new Date()) + ' ' + new Date().toTimeString().slice(0, 5)
    tf.vehicleId = vehicle.id
    tf.vehiclePlateNumber = vehicle.plateNumber
    tf.handler = handler
    vehicle.status = 'transferring'
    return true
  }

  function shipTransfer(transferId: string): boolean {
    const tf = state.transfers.find((t) => t.id === transferId)
    if (!tf || tf.status !== 'approved') return false
    if (tf.fromStoreId !== state.currentStoreId) return false
    tf.status = 'in_transit'
    return true
  }

  function completeTransfer(transferId: string): boolean {
    const tf = state.transfers.find((t) => t.id === transferId)
    if (!tf || tf.status !== 'in_transit') return false
    if (tf.toStoreId !== state.currentStoreId) return false
    tf.status = 'completed'
    tf.arrivalTime = formatDate(new Date()) + ' ' + new Date().toTimeString().slice(0, 5)

    if (tf.vehicleId) {
      const vehicle = state.vehicles.find((v) => v.id === tf.vehicleId)
      if (vehicle) {
        vehicle.storeId = tf.toStoreId
        vehicle.status = 'available'
      }
    }
    return true
  }

  function addImportedViolations(items: Omit<Violation, 'id' | 'matchedOrderId' | 'matchedCustomer' | 'matchedCustomerPhone' | 'status' | 'handlingMethod'>[]) {
    items.forEach((item) => {
      const v: Violation = {
        ...item,
        id: 'vio-' + String(state.violations.length + 1).padStart(3, '0'),
        matchedOrderId: '',
        matchedCustomer: '',
        matchedCustomerPhone: '',
        status: 'pending',
        handlingMethod: 'self',
      }
      state.violations.unshift(v)
    })
  }

  return {
    state,
    storeVehicles,
    todayPickupCount,
    todayReturnCount,
    availableVehicleCount,
    pendingViolationCount,
    activeOrders,
    storeActiveOrders,
    completedOrders,
    storeCompletedOrders,
    storeTransfers,
    isFromStore,
    isToStore,
    getCategoryAvailability,
    getOrdersForCategoryDate,
    returnVehicle,
    addDamageToOrder,
    removeDamageFromOrder,
    estimateDamageCost,
    matchViolation,
    notifyViolation,
    processViolation,
    completeViolation,
    createTransferRequest,
    approveTransfer,
    shipTransfer,
    completeTransfer,
    addImportedViolations,
  }
}
