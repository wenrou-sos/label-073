export interface Store {
  id: string
  name: string
}

export interface Vehicle {
  id: string
  plateNumber: string
  model: string
  category: string
  status: 'available' | 'rented' | 'maintenance' | 'transferring'
  currentMileage: number
  fuelLevel: number
  storeId: string
}

export interface Damage {
  id: string
  x: number
  y: number
  type: 'scratch' | 'dent' | 'paint' | 'crack'
  estimatedCost: number
  description: string
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  vehicleId: string
  plateNumber: string
  vehicleModel: string
  vehicleCategory: string
  pickupDate: string
  returnDate: string
  actualReturnDate: string
  returnMileage: number
  returnFuelLevel: number
  status: 'reserved' | 'active' | 'returned' | 'overdue'
  damages: Damage[]
  extraCharges: number
  pickupDamages: Damage[]
}

export interface Violation {
  id: string
  plateNumber: string
  violationTime: string
  location: string
  points: number
  fine: number
  violationType: string
  matchedOrderId: string
  matchedCustomer: string
  matchedCustomerPhone: string
  status: 'pending' | 'matched' | 'notified' | 'processing' | 'completed'
  handlingMethod: 'self' | 'agency'
}

export interface TransferRequest {
  id: string
  fromStoreId: string
  fromStoreName: string
  toStoreId: string
  toStoreName: string
  vehicleCategory: string
  vehicleId: string
  vehiclePlateNumber: string
  status: 'pending' | 'approved' | 'in_transit' | 'completed'
  requestTime: string
  approvedTime: string
  arrivalTime: string
  handler: string
  remark: string
}

export type DamageType = 'scratch' | 'dent' | 'paint' | 'crack'

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  scratch: '划痕',
  dent: '凹陷',
  paint: '掉漆',
  crack: '裂纹',
}

export const DAMAGE_COST_MAP: Record<DamageType, number> = {
  scratch: 200,
  dent: 500,
  paint: 350,
  crack: 800,
}

export const VEHICLE_CATEGORIES = ['经济型', '舒适型', 'SUV', '商务型', '豪华型']

export const VIOLATION_STATUS_LABELS: Record<Violation['status'], string> = {
  pending: '待匹配',
  matched: '已匹配',
  notified: '已通知',
  processing: '处理中',
  completed: '已完成',
}

export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  reserved: '已预约',
  active: '使用中',
  returned: '已还车',
  overdue: '逾期',
}

export const TRANSFER_STATUS_LABELS: Record<TransferRequest['status'], string> = {
  pending: '待确认',
  approved: '已确认',
  in_transit: '运输中',
  completed: '已完成',
}
