import { describe, it, expect, beforeEach } from 'vitest'
import { useReturnForm } from '@/composables/useReturnForm'
import type { Order } from '@/types'

const mockOrder: Order = {
  id: 'ord-test-001',
  customerName: '测试客户',
  customerPhone: '13800000000',
  vehicleId: 'v-test-001',
  plateNumber: '京A11111',
  vehicleModel: '丰田卡罗拉',
  vehicleCategory: '经济型',
  pickupDate: '2026-06-10',
  returnDate: '2026-06-15',
  actualReturnDate: '',
  returnMileage: 0,
  returnFuelLevel: 0,
  status: 'active',
  damages: [],
  extraCharges: 0,
  pickupDamages: [],
}

const mockOrder2: Order = {
  id: 'ord-test-002',
  customerName: '测试客户2',
  customerPhone: '13900000000',
  vehicleId: 'v-test-002',
  plateNumber: '京A22222',
  vehicleModel: '大众帕萨特',
  vehicleCategory: '舒适型',
  pickupDate: '2026-06-12',
  returnDate: '2026-06-16',
  actualReturnDate: '',
  returnMileage: 0,
  returnFuelLevel: 0,
  status: 'active',
  damages: [],
  extraCharges: 0,
  pickupDamages: [],
}

describe('useReturnForm', () => {
  describe('初始状态', () => {
    it('应该有正确的初始值', () => {
      const { step, selectedOrder, mileage, fuelLevel, damages, pendingClickPos, returnError } = useReturnForm()

      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()
      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)
      expect(damages.value).toEqual([])
      expect(pendingClickPos.value).toBeNull()
      expect(returnError.value).toBe('')
    })
  })

  describe('resetForm', () => {
    it('应该重置所有字段到初始状态', () => {
      const { step, selectedOrder, mileage, fuelLevel, damages, pendingClickPos, returnError, resetForm } = useReturnForm()

      step.value = 3
      selectedOrder.value = mockOrder
      mileage.value = 50000
      fuelLevel.value = 30
      damages.value = [
        { id: 'dmg-1', x: 30, y: 40, type: 'scratch', estimatedCost: 300, description: '划痕' },
      ]
      pendingClickPos.value = { x: 50, y: 50 }
      returnError.value = '测试错误'

      resetForm()

      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()
      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)
      expect(damages.value).toEqual([])
      expect(pendingClickPos.value).toBeNull()
      expect(returnError.value).toBe('')
    })

    it('多次调用重置应该保持稳定', () => {
      const { step, resetForm } = useReturnForm()

      step.value = 2
      resetForm()
      resetForm()
      resetForm()

      expect(step.value).toBe(1)
    })
  })

  describe('selectOrder', () => {
    it('选择新订单前应该先重置表单', () => {
      const { step, selectedOrder, mileage, fuelLevel, damages, selectOrder, resetForm } = useReturnForm()

      const resetSpy = vi.fn(resetForm)

      mileage.value = 10000
      fuelLevel.value = 50
      damages.value = [
        { id: 'dmg-old', x: 10, y: 20, type: 'dent', estimatedCost: 800, description: '凹陷' },
      ]

      selectOrder(mockOrder)

      expect(selectedOrder.value).toEqual(mockOrder)
      expect(step.value).toBe(2)
      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)
      expect(damages.value).toEqual([])
    })

    it('连续选择不同订单应该每次都重置', () => {
      const { step, selectedOrder, mileage, selectOrder } = useReturnForm()

      selectOrder(mockOrder)
      expect(selectedOrder.value?.id).toBe('ord-test-001')
      expect(step.value).toBe(2)

      mileage.value = 20000

      selectOrder(mockOrder2)
      expect(selectedOrder.value?.id).toBe('ord-test-002')
      expect(step.value).toBe(2)
      expect(mileage.value).toBe(0)
    })
  })

  describe('goBack', () => {
    it('从 step 3 回到 step 2 时应该清除损伤数据和待点击位置', () => {
      const { step, damages, pendingClickPos, goBack } = useReturnForm()

      step.value = 3
      damages.value = [
        { id: 'dmg-1', x: 30, y: 40, type: 'scratch', estimatedCost: 300, description: '划痕' },
        { id: 'dmg-2', x: 60, y: 70, type: 'dent', estimatedCost: 800, description: '凹陷' },
      ]
      pendingClickPos.value = { x: 45, y: 55 }

      goBack()

      expect(step.value).toBe(2)
      expect(damages.value).toEqual([])
      expect(pendingClickPos.value).toBeNull()
    })

    it('从 step 2 回到 step 1 时应该完全重置表单', () => {
      const { step, selectedOrder, mileage, fuelLevel, goBack } = useReturnForm()

      step.value = 2
      selectedOrder.value = mockOrder
      mileage.value = 30000
      fuelLevel.value = 45

      goBack()

      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()
      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)
    })

    it('在 step 1 调用 goBack 应该保持在 step 1 不做任何操作', () => {
      const { step, selectedOrder, goBack } = useReturnForm()

      step.value = 1
      selectedOrder.value = mockOrder

      goBack()

      expect(step.value).toBe(1)
      expect(selectedOrder.value).toEqual(mockOrder)
    })

    it('返回时应该清除错误信息', () => {
      const { step, returnError, goBack } = useReturnForm()

      step.value = 3
      returnError.value = '这是一个错误'

      goBack()

      expect(returnError.value).toBe('')
    })
  })

  describe('业务流程集成测试', () => {
    it('完整还车流程：选择订单 -> 填写里程 -> 添加损伤 -> 重置', () => {
      const { step, selectedOrder, mileage, fuelLevel, damages, selectOrder, goBack, resetForm } = useReturnForm()

      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()

      selectOrder(mockOrder)
      expect(step.value).toBe(2)
      expect(selectedOrder.value?.id).toBe('ord-test-001')

      mileage.value = 45000
      fuelLevel.value = 60
      step.value = 3

      damages.value.push(
        { id: 'dmg-1', x: 25, y: 35, type: 'paint', estimatedCost: 500, description: '掉漆' }
      )

      expect(damages.value.length).toBe(1)
      expect(mileage.value).toBe(45000)

      goBack()
      expect(step.value).toBe(2)
      expect(damages.value).toEqual([])
      expect(mileage.value).toBe(45000)

      goBack()
      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()
      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)

      selectOrder(mockOrder2)
      expect(step.value).toBe(2)
      expect(selectedOrder.value?.id).toBe('ord-test-002')
      expect(damages.value).toEqual([])

      resetForm()
      expect(step.value).toBe(1)
      expect(selectedOrder.value).toBeNull()
    })
  })

  describe('边界情况', () => {
    it('重置时应该清除所有类型的损伤', () => {
      const { damages, resetForm } = useReturnForm()

      damages.value = [
        { id: '1', x: 10, y: 20, type: 'scratch', estimatedCost: 300, description: '划痕' },
        { id: '2', x: 30, y: 40, type: 'dent', estimatedCost: 800, description: '凹陷' },
        { id: '3', x: 50, y: 60, type: 'paint', estimatedCost: 500, description: '掉漆' },
        { id: '4', x: 70, y: 80, type: 'crack', estimatedCost: 1200, description: '裂纹' },
      ]

      resetForm()

      expect(damages.value).toEqual([])
      expect(damages.value.length).toBe(0)
    })

    it('里程和油量重置应该精确到初始值', () => {
      const { mileage, fuelLevel, resetForm } = useReturnForm()

      mileage.value = 99999
      fuelLevel.value = 0

      resetForm()

      expect(mileage.value).toBe(0)
      expect(fuelLevel.value).toBe(80)
    })

    it('错误信息重置', () => {
      const { returnError, resetForm, goBack } = useReturnForm()

      returnError.value = '门店不匹配错误'
      resetForm()
      expect(returnError.value).toBe('')

      returnError.value = '另一个错误'
      goBack()
      expect(returnError.value).toBe('')
    })
  })
})
