/** 로그인 전 장바구니 담기 시도 시 저장 키 */
export const PENDING_ADD_KEY = 'pendingAddToCart'

export function savePendingAdd(payload) {
  try {
    sessionStorage.setItem(PENDING_ADD_KEY, JSON.stringify(payload))
  } catch (_) {}
}

export function getPendingAdd() {
  try {
    const raw = sessionStorage.getItem(PENDING_ADD_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export function clearPendingAdd() {
  try {
    sessionStorage.removeItem(PENDING_ADD_KEY)
  } catch (_) {}
}
