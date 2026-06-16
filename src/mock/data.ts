import type { Store, Vehicle, Order, Violation, TransferRequest } from '@/types'

const TODAY = '2026-06-16'

function offsetDate(days: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const stores: Store[] = [
  { id: 'store-1', name: '朝阳门店' },
  { id: 'store-2', name: '海淀门店' },
  { id: 'store-3', name: '国贸门店' },
]

export const vehicles: Vehicle[] = [
  { id: 'v-001', plateNumber: '京A12345', model: '丰田卡罗拉', category: '经济型', status: 'rented', currentMileage: 35200, fuelLevel: 65, storeId: 'store-1' },
  { id: 'v-002', plateNumber: '京A23456', model: '本田思域', category: '经济型', status: 'available', currentMileage: 28100, fuelLevel: 80, storeId: 'store-1' },
  { id: 'v-003', plateNumber: '京A34567', model: '大众朗逸', category: '经济型', status: 'available', currentMileage: 41000, fuelLevel: 55, storeId: 'store-1' },
  { id: 'v-004', plateNumber: '京A45678', model: '日产轩逸', category: '经济型', status: 'available', currentMileage: 19800, fuelLevel: 90, storeId: 'store-1' },
  { id: 'v-005', plateNumber: '京B11111', model: '大众帕萨特', category: '舒适型', status: 'rented', currentMileage: 52300, fuelLevel: 40, storeId: 'store-1' },
  { id: 'v-006', plateNumber: '京B22222', model: '丰田凯美瑞', category: '舒适型', status: 'available', currentMileage: 31500, fuelLevel: 75, storeId: 'store-1' },
  { id: 'v-007', plateNumber: '京B33333', model: '本田雅阁', category: '舒适型', status: 'rented', currentMileage: 44700, fuelLevel: 30, storeId: 'store-1' },
  { id: 'v-008', plateNumber: '京B44444', model: '别克君威', category: '舒适型', status: 'available', currentMileage: 38000, fuelLevel: 60, storeId: 'store-1' },
  { id: 'v-009', plateNumber: '京C55555', model: '丰田RAV4', category: 'SUV', status: 'rented', currentMileage: 29600, fuelLevel: 50, storeId: 'store-1' },
  { id: 'v-010', plateNumber: '京C66666', model: '本田CR-V', category: 'SUV', status: 'available', currentMileage: 36200, fuelLevel: 70, storeId: 'store-1' },
  { id: 'v-011', plateNumber: '京C77777', model: '大众途观', category: 'SUV', status: 'rented', currentMileage: 48100, fuelLevel: 35, storeId: 'store-1' },
  { id: 'v-012', plateNumber: '京C88888', model: '奥迪Q5', category: 'SUV', status: 'maintenance', currentMileage: 52000, fuelLevel: 20, storeId: 'store-1' },
  { id: 'v-013', plateNumber: '京D99999', model: '别克GL8', category: '商务型', status: 'rented', currentMileage: 61000, fuelLevel: 45, storeId: 'store-1' },
  { id: 'v-014', plateNumber: '京D00001', model: '奔驰V260', category: '商务型', status: 'available', currentMileage: 55000, fuelLevel: 85, storeId: 'store-1' },
  { id: 'v-015', plateNumber: '京E10001', model: '宝马5系', category: '豪华型', status: 'rented', currentMileage: 42000, fuelLevel: 55, storeId: 'store-1' },
  { id: 'v-016', plateNumber: '京E20002', model: '奔驰E级', category: '豪华型', status: 'available', currentMileage: 38000, fuelLevel: 90, storeId: 'store-1' },
  { id: 'v-017', plateNumber: '京F30003', model: '丰田卡罗拉', category: '经济型', status: 'available', currentMileage: 22300, fuelLevel: 78, storeId: 'store-2' },
  { id: 'v-018', plateNumber: '京F40004', model: '大众朗逸', category: '经济型', status: 'rented', currentMileage: 33200, fuelLevel: 60, storeId: 'store-2' },
  { id: 'v-019', plateNumber: '京G50005', model: '丰田凯美瑞', category: '舒适型', status: 'available', currentMileage: 44500, fuelLevel: 65, storeId: 'store-2' },
  { id: 'v-020', plateNumber: '京G60006', model: '本田CR-V', category: 'SUV', status: 'available', currentMileage: 26800, fuelLevel: 72, storeId: 'store-2' },
  { id: 'v-021', plateNumber: '京H70007', model: '别克GL8', category: '商务型', status: 'rented', currentMileage: 58900, fuelLevel: 38, storeId: 'store-3' },
  { id: 'v-022', plateNumber: '京H80008', model: '宝马5系', category: '豪华型', status: 'available', currentMileage: 31200, fuelLevel: 82, storeId: 'store-3' },
  { id: 'v-023', plateNumber: '京H90009', model: '丰田RAV4', category: 'SUV', status: 'available', currentMileage: 39700, fuelLevel: 58, storeId: 'store-3' },
  { id: 'v-024', plateNumber: '京J10010', model: '奥迪Q5', category: 'SUV', status: 'rented', currentMileage: 44500, fuelLevel: 42, storeId: 'store-3' },
]

export const orders: Order[] = [
  { id: 'ord-001', customerName: '张伟', customerPhone: '13800001111', vehicleId: 'v-001', plateNumber: '京A12345', vehicleModel: '丰田卡罗拉', vehicleCategory: '经济型', pickupDate: offsetDate(-2), returnDate: TODAY, actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-002', customerName: '李娜', customerPhone: '13800002222', vehicleId: 'v-005', plateNumber: '京B11111', vehicleModel: '大众帕萨特', vehicleCategory: '舒适型', pickupDate: offsetDate(-3), returnDate: TODAY, actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-003', customerName: '王强', customerPhone: '13800003333', vehicleId: 'v-009', plateNumber: '京C55555', vehicleModel: '丰田RAV4', vehicleCategory: 'SUV', pickupDate: offsetDate(-1), returnDate: offsetDate(2), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-004', customerName: '赵敏', customerPhone: '13800004444', vehicleId: 'v-013', plateNumber: '京D99999', vehicleModel: '别克GL8', vehicleCategory: '商务型', pickupDate: offsetDate(-1), returnDate: offsetDate(3), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-005', customerName: '孙磊', customerPhone: '13800005555', vehicleId: 'v-015', plateNumber: '京E10001', vehicleModel: '宝马5系', vehicleCategory: '豪华型', pickupDate: TODAY, returnDate: offsetDate(3), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-006', customerName: '周芳', customerPhone: '13800006666', vehicleId: 'v-007', plateNumber: '京B33333', vehicleModel: '本田雅阁', vehicleCategory: '舒适型', pickupDate: offsetDate(-4), returnDate: offsetDate(-1), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'overdue', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-007', customerName: '吴涛', customerPhone: '13800007777', vehicleId: 'v-011', plateNumber: '京C77777', vehicleModel: '大众途观', vehicleCategory: 'SUV', pickupDate: offsetDate(-2), returnDate: offsetDate(1), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-008', customerName: '郑颖', customerPhone: '13800008888', vehicleId: 'v-002', plateNumber: '京A23456', vehicleModel: '本田思域', vehicleCategory: '经济型', pickupDate: offsetDate(1), returnDate: offsetDate(4), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-009', customerName: '陈杰', customerPhone: '13800009999', vehicleId: 'v-003', plateNumber: '京A34567', vehicleModel: '大众朗逸', vehicleCategory: '经济型', pickupDate: offsetDate(1), returnDate: offsetDate(5), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-010', customerName: '林静', customerPhone: '13800010000', vehicleId: 'v-006', plateNumber: '京B22222', vehicleModel: '丰田凯美瑞', vehicleCategory: '舒适型', pickupDate: offsetDate(2), returnDate: offsetDate(5), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-011', customerName: '黄辉', customerPhone: '13800011111', vehicleId: 'v-010', plateNumber: '京C66666', vehicleModel: '本田CR-V', vehicleCategory: 'SUV', pickupDate: offsetDate(2), returnDate: offsetDate(6), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-012', customerName: '许敏', customerPhone: '13800012222', vehicleId: 'v-016', plateNumber: '京E20002', vehicleModel: '奔驰E级', vehicleCategory: '豪华型', pickupDate: offsetDate(1), returnDate: offsetDate(4), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-013', customerName: '朱丽', customerPhone: '13800013333', vehicleId: 'v-014', plateNumber: '京D00001', vehicleModel: '奔驰V260', vehicleCategory: '商务型', pickupDate: offsetDate(3), returnDate: offsetDate(6), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-014', customerName: '胡波', customerPhone: '13800014444', vehicleId: 'v-004', plateNumber: '京A45678', vehicleModel: '日产轩逸', vehicleCategory: '经济型', pickupDate: offsetDate(3), returnDate: offsetDate(6), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-015', customerName: '高琳', customerPhone: '13800015555', vehicleId: 'v-008', plateNumber: '京B44444', vehicleModel: '别克君威', vehicleCategory: '舒适型', pickupDate: offsetDate(4), returnDate: offsetDate(7), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-016', customerName: '马超', customerPhone: '13800016666', vehicleId: 'v-001', plateNumber: '京A12345', vehicleModel: '丰田卡罗拉', vehicleCategory: '经济型', pickupDate: offsetDate(4), returnDate: offsetDate(7), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-017', customerName: '罗翔', customerPhone: '13800017777', vehicleId: 'v-018', plateNumber: '京F40004', vehicleModel: '大众朗逸', vehicleCategory: '经济型', pickupDate: offsetDate(-1), returnDate: TODAY, actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-018', customerName: '韩梅', customerPhone: '13800018888', vehicleId: 'v-021', plateNumber: '京H70007', vehicleModel: '别克GL8', vehicleCategory: '商务型', pickupDate: offsetDate(-2), returnDate: offsetDate(1), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-019', customerName: '田甜', customerPhone: '13800019999', vehicleId: 'v-024', plateNumber: '京J10010', vehicleModel: '奥迪Q5', vehicleCategory: 'SUV', pickupDate: offsetDate(-1), returnDate: offsetDate(2), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'active', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-020', customerName: '冯刚', customerPhone: '13800020000', vehicleId: 'v-002', plateNumber: '京A23456', vehicleModel: '本田思域', vehicleCategory: '经济型', pickupDate: offsetDate(5), returnDate: offsetDate(8), actualReturnDate: '', returnMileage: 0, returnFuelLevel: 0, status: 'reserved', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-021', customerName: '钱丽', customerPhone: '13800021111', vehicleId: 'v-002', plateNumber: '京A23456', vehicleModel: '本田思域', vehicleCategory: '经济型', pickupDate: offsetDate(-10), returnDate: offsetDate(-6), actualReturnDate: offsetDate(-6), returnMileage: 28500, returnFuelLevel: 75, status: 'returned', damages: [], extraCharges: 0, pickupDamages: [] },
  { id: 'ord-022', customerName: '赵明', customerPhone: '13800022222', vehicleId: 'v-006', plateNumber: '京B22222', vehicleModel: '丰田凯美瑞', vehicleCategory: '舒适型', pickupDate: offsetDate(-12), returnDate: offsetDate(-8), actualReturnDate: offsetDate(-8), returnMileage: 32100, returnFuelLevel: 45, status: 'returned', damages: [
    { id: 'dmg-hist-001', x: 35, y: 25, type: 'scratch', estimatedCost: 300, description: '划痕' },
    { id: 'dmg-hist-002', x: 68, y: 70, type: 'dent', estimatedCost: 800, description: '凹陷' },
  ], extraCharges: 1100, pickupDamages: [] },
  { id: 'ord-023', customerName: '孙伟', customerPhone: '13800023333', vehicleId: 'v-010', plateNumber: '京C66666', vehicleModel: '本田CR-V', vehicleCategory: 'SUV', pickupDate: offsetDate(-8), returnDate: offsetDate(-3), actualReturnDate: offsetDate(-3), returnMileage: 37500, returnFuelLevel: 60, status: 'returned', damages: [
    { id: 'dmg-hist-003', x: 20, y: 55, type: 'paint', estimatedCost: 500, description: '掉漆' },
  ], extraCharges: 500, pickupDamages: [] },
  { id: 'ord-024', customerName: '周杰', customerPhone: '13800024444', vehicleId: 'v-016', plateNumber: '京E20002', vehicleModel: '奔驰E级', vehicleCategory: '豪华型', pickupDate: offsetDate(-15), returnDate: offsetDate(-10), actualReturnDate: offsetDate(-10), returnMileage: 39200, returnFuelLevel: 90, status: 'returned', damages: [], extraCharges: 0, pickupDamages: [] },
]

export const violations: Violation[] = [
  { id: 'vio-001', plateNumber: '京A12345', violationTime: offsetDate(-1) + ' 14:30', location: '朝阳区东三环主路', points: 3, fine: 200, violationType: '超速行驶', matchedOrderId: 'ord-001', matchedCustomer: '张伟', matchedCustomerPhone: '13800001111', status: 'matched', handlingMethod: 'self' },
  { id: 'vio-002', plateNumber: '京B11111', violationTime: offsetDate(-2) + ' 09:15', location: '海淀区中关村大街', points: 0, fine: 200, violationType: '违停', matchedOrderId: 'ord-002', matchedCustomer: '李娜', matchedCustomerPhone: '13800002222', status: 'notified', handlingMethod: 'agency' },
  { id: 'vio-003', plateNumber: '京C55555', violationTime: offsetDate(0) + ' 11:00', location: '朝阳区建国路', points: 6, fine: 200, violationType: '闯红灯', matchedOrderId: 'ord-003', matchedCustomer: '王强', matchedCustomerPhone: '13800003333', status: 'pending', handlingMethod: 'self' },
  { id: 'vio-004', plateNumber: '京D99999', violationTime: offsetDate(-1) + ' 16:45', location: '西城区金融街', points: 0, fine: 100, violationType: '违停', matchedOrderId: 'ord-004', matchedCustomer: '赵敏', matchedCustomerPhone: '13800004444', status: 'matched', handlingMethod: 'self' },
  { id: 'vio-005', plateNumber: '京E10001', violationTime: offsetDate(0) + ' 08:20', location: '东城区东直门外大街', points: 3, fine: 200, violationType: '超速行驶', matchedOrderId: 'ord-005', matchedCustomer: '孙磊', matchedCustomerPhone: '13800005555', status: 'pending', handlingMethod: 'self' },
  { id: 'vio-006', plateNumber: '京B33333', violationTime: offsetDate(-3) + ' 10:30', location: '丰台区南三环', points: 3, fine: 200, violationType: '不按车道行驶', matchedOrderId: 'ord-006', matchedCustomer: '周芳', matchedCustomerPhone: '13800006666', status: 'completed', handlingMethod: 'agency' },
  { id: 'vio-007', plateNumber: '京C77777', violationTime: offsetDate(-1) + ' 15:00', location: '朝阳区望京西路', points: 0, fine: 200, violationType: '违停', matchedOrderId: 'ord-007', matchedCustomer: '吴涛', matchedCustomerPhone: '13800007777', status: 'notified', handlingMethod: 'self' },
  { id: 'vio-008', plateNumber: '京H70007', violationTime: offsetDate(-1) + ' 13:20', location: '国贸桥东', points: 6, fine: 200, violationType: '闯红灯', matchedOrderId: 'ord-018', matchedCustomer: '韩梅', matchedCustomerPhone: '13800018888', status: 'pending', handlingMethod: 'self' },
]

export const transferRequests: TransferRequest[] = [
  { id: 'tf-001', fromStoreId: 'store-2', fromStoreName: '海淀门店', toStoreId: 'store-1', toStoreName: '朝阳门店', vehicleCategory: '经济型', vehicleId: 'v-017', vehiclePlateNumber: '京F30003', status: 'in_transit', requestTime: offsetDate(-1) + ' 09:00', approvedTime: offsetDate(-1) + ' 10:30', arrivalTime: '', handler: '李明', remark: '朝阳门店经济型车辆不足' },
  { id: 'tf-002', fromStoreId: 'store-3', fromStoreName: '国贸门店', toStoreId: 'store-1', toStoreName: '朝阳门店', vehicleCategory: 'SUV', vehicleId: 'v-023', vehiclePlateNumber: '京H90009', status: 'approved', requestTime: offsetDate(0) + ' 08:30', approvedTime: offsetDate(0) + ' 09:15', arrivalTime: '', handler: '王刚', remark: '周末SUV需求量大' },
  { id: 'tf-003', fromStoreId: 'store-1', fromStoreName: '朝阳门店', toStoreId: 'store-3', toStoreName: '国贸门店', vehicleCategory: '豪华型', vehicleId: '', vehiclePlateNumber: '', status: 'pending', requestTime: offsetDate(0) + ' 10:00', approvedTime: '', arrivalTime: '', handler: '', remark: '国贸门店豪华型缺车' },
  { id: 'tf-004', fromStoreId: 'store-2', fromStoreName: '海淀门店', toStoreId: 'store-3', toStoreName: '国贸门店', vehicleCategory: '商务型', vehicleId: 'v-019', vehiclePlateNumber: '京G50005', status: 'completed', requestTime: offsetDate(-5) + ' 14:00', approvedTime: offsetDate(-5) + ' 15:00', arrivalTime: offsetDate(-4) + ' 10:00', handler: '赵磊', remark: '' },
]

export const CURRENT_STORE_ID = 'store-1'
export const CURRENT_STORE_NAME = '朝阳门店'
