const API_BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const text = await res.text().catch(() => res.statusText)
  if (!res.ok) {
    try {
      const body = JSON.parse(text)
      throw new Error(body.error || body.message || text)
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text || res.statusText)
      throw e
    }
  }
  return text ? JSON.parse(text) : {}
}

export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.page != null) qs.set('page', params.page)
    if (params.limit != null) qs.set('limit', params.limit)
    if (params.category) qs.set('category', params.category)
    const query = qs.toString()
    return api('/api/products' + (query ? '?' + query : ''))
  },
  get: (id) => api(`/api/products/${id}`),
  getAvailableDates: (id, params = {}) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    const query = qs.toString()
    return api(`/api/products/${id}/available-dates` + (query ? '?' + query : ''))
  },
  getAvailableSlots: (id, date) => {
    return api(`/api/products/${id}/available-slots?date=${encodeURIComponent(date)}`)
  },
  create: (body) => api('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
}

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const usersApi = {
  list: () => api('/api/users'),
  create: (body) => api('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => api('/api/users/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: (token) =>
    api('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
  updateUserType: (userId, user_type) =>
    api(`/api/users/${userId}/user-type`, {
      method: 'PATCH',
      body: JSON.stringify({ user_type }),
      headers: getAuthHeaders(),
    }),
}

export const cartApi = {
  getCart: () => api('/api/cart', { headers: getAuthHeaders() }),
  addItem: (body) =>
    api('/api/cart/items', { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders() }),
  updateItem: (itemId, body) =>
    api(`/api/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders() }),
  removeItem: (itemId) =>
    api(`/api/cart/items/${itemId}`, { method: 'DELETE', headers: getAuthHeaders() }),
  clearCart: () => api('/api/cart', { method: 'DELETE', headers: getAuthHeaders() }),
}

export const ordersApi = {
  create: (body) =>
    api('/api/orders', { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders() }),
  getMyOrders: () => api('/api/orders', { headers: getAuthHeaders() }),
  getById: (id) => api(`/api/orders/${id}`, { headers: getAuthHeaders() }),
  getAdminMembers: () => api('/api/orders/admin/members', { headers: getAuthHeaders() }),
  getAdminOrders: (params = {}) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.search) qs.set('search', params.search)
    const query = qs.toString()
    return api('/api/orders/admin/list' + (query ? '?' + query : ''), { headers: getAuthHeaders() })
  },
  updateStatus: (orderId, status) =>
    api(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: getAuthHeaders(),
    }),
}
