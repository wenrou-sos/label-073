import { ref } from 'vue'
import type { Damage, Order } from '@/types'

export function useReturnForm() {
  const step = ref(1)
  const selectedOrder = ref<Order | null>(null)
  const mileage = ref<number>(0)
  const fuelLevel = ref<number>(80)
  const damages = ref<Damage[]>([])
  const pendingClickPos = ref<{ x: number; y: number } | null>(null)
  const returnError = ref('')

  function resetForm() {
    selectedOrder.value = null
    mileage.value = 0
    fuelLevel.value = 80
    damages.value = []
    pendingClickPos.value = null
    returnError.value = ''
    step.value = 1
  }

  function selectOrder(order: Order) {
    resetForm()
    selectedOrder.value = order
    step.value = 2
  }

  function goBack() {
    returnError.value = ''
    if (step.value === 3) {
      damages.value = []
      pendingClickPos.value = null
      step.value = 2
    } else if (step.value === 2) {
      resetForm()
    }
  }

  return {
    step,
    selectedOrder,
    mileage,
    fuelLevel,
    damages,
    pendingClickPos,
    returnError,
    resetForm,
    selectOrder,
    goBack,
  }
}
