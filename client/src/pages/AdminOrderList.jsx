import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersApi } from '../lib/api'

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '결제대기' },
  { id: 'paid', label: '결제완료' },
  { id: 'completed', label: '수업 완료' },
  { id: 'cancelled', label: '취소' },
  { id: 'refunded', label: '환불' },
]

function getStatusLabel(status) {
  const map = {
    pending: '결제대기',
    paid: '결제완료',
    completed: '수업 완료',
    cancelled: '취소',
    refunded: '환불',
  }
  return map[status] ?? status
}

function getStatusClass(status) {
  const map = {
    paid: 'admin-order-status--paid',
    pending: 'admin-order-status--pending',
    completed: 'admin-order-status--completed',
    cancelled: 'admin-order-status--cancelled',
    refunded: 'admin-order-status--refunded',
  }
  return map[status] ?? ''
}

function formatItemsSummary(items) {
  if (!items?.length) return '-'
  const names = items.map((i) => i.productName || i.product?.name || '상품').filter(Boolean)
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0)
  if (names.length === 1) return `${names[0]} · ${totalQty}건`
  return `${names[0]} 외 ${names.length - 1}건 · 총 ${totalQty}건`
}

export default function AdminOrderList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [updatingId, setUpdatingId] = useState(null)

  const [appliedSearch, setAppliedSearch] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.user_type !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    loadOrders()
  }, [user, navigate, statusFilter, appliedSearch])

  const loadOrders = () => {
    setLoading(true)
    Promise.all([
      ordersApi.getAdminOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: appliedSearch || undefined,
      }),
      ordersApi.getAdminOrders(),
    ])
      .then(([filteredRes, allRes]) => {
        setOrders(filteredRes.orders ?? [])
        setTotal(filteredRes.total ?? 0)
        const all = allRes.orders ?? []
        const counts = { all: all.length }
        all.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1 })
        setStatusCounts(counts)
      })
      .catch((e) => setError(e.message || '주문 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(orders.map((o) => o._id)))
  }

  const handleUpdateStatus = async (orderId, status) => {
    if (updatingId) return
    if (status === 'cancelled' && !window.confirm('수업을 취소하시겠습니까?')) return
    if (status === 'paid' && !window.confirm('수업 완료를 수업 예정으로 되돌리시겠습니까?')) return
    setUpdatingId(orderId)
    try {
      await ordersApi.updateStatus(orderId, status)
      loadOrders()
    } catch (e) {
      alert(e.message || '상태 변경에 실패했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!user || user.user_type !== 'admin') return null

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error}</p>
        <Link to="/admin">대시보드로</Link>
      </div>
    )
  }

  return (
    <div className="admin-order-page">
      <header className="admin-order-header">
        <div className="admin-order-header-top">
          <div>
            <h1 className="admin-order-title">주문</h1>
            <p className="admin-order-subtitle">새로운 주문 관리 튜토리얼을 진행해 보세요</p>
          </div>
          <div className="admin-order-actions">
            <button type="button" className="admin-order-btn-outline" disabled>
              내보내기
            </button>
            <Link to="/products" className="admin-order-btn-primary">
              주문 생성
            </Link>
          </div>
        </div>
      </header>

      <div className="admin-order-tabs">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'all' ? statusCounts.all : statusCounts[tab.id]
          const n = count ?? 0
          return (
            <button
              key={tab.id}
              type="button"
              className={`admin-order-tab ${statusFilter === tab.id ? 'admin-order-tab--active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label} {n}
            </button>
          )
        })}
      </div>

      <div className="admin-order-toolbar">
        <span className="admin-order-toolbar-count">전체 {total}</span>
        <div className="admin-order-search-wrap">
          <div className="admin-order-search-inner">
            <span className="admin-order-search-icon" aria-hidden>🔍</span>
            <input
              type="search"
              className="admin-order-search"
              placeholder="이름, 이메일, 주문번호"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
            />
          </div>
          <button
            type="button"
            className="admin-order-search-btn"
            onClick={() => setAppliedSearch(search)}
          >
            검색
          </button>
        </div>
      </div>

      <div className="admin-order-table-wrap">
        {loading ? (
          <p className="admin-loading">로딩 중...</p>
        ) : (
          <table className="admin-order-table">
            <thead>
              <tr>
                <th className="admin-order-th-check">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={handleToggleSelectAll}
                    aria-label="전체 선택"
                  />
                </th>
                <th>주문번호</th>
                <th>구매자</th>
                <th>품목: 요약 보기</th>
                <th>최종 결제금액</th>
                <th>주문상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-order-empty">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="admin-order-td-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order._id)}
                        onChange={() => handleToggleSelect(order._id)}
                        aria-label={`주문 ${order.orderNumber} 선택`}
                      />
                    </td>
                    <td>
                      <Link to={`/orders/${order._id}`} className="admin-order-link">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-order-buyer">{order.user?.name ?? '-'}</span>
                      <span className="admin-order-buyer-email">{order.user?.email ?? ''}</span>
                    </td>
                    <td className="admin-order-items">{formatItemsSummary(order.items)}</td>
                    <td className="admin-order-amount">₩{Number(order.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`admin-order-status ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="admin-order-actions-cell">
                      {order.status === 'paid' && (
                        <>
                          <button
                            type="button"
                            className="admin-order-action-btn admin-order-action-btn--complete"
                            onClick={() => handleUpdateStatus(order._id, 'completed')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? '처리중' : '수업 완료'}
                          </button>
                          <button
                            type="button"
                            className="admin-order-action-btn admin-order-action-btn--cancel"
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? '처리중' : '취소'}
                          </button>
                        </>
                      )}
                      {order.status === 'completed' && (
                        <>
                          <button
                            type="button"
                            className="admin-order-action-btn admin-order-action-btn--complete"
                            onClick={() => handleUpdateStatus(order._id, 'paid')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? '처리중' : '수업 예정'}
                          </button>
                          <button
                            type="button"
                            className="admin-order-action-btn admin-order-action-btn--cancel"
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? '처리중' : '취소'}
                          </button>
                        </>
                      )}
                      {(order.status === 'cancelled' || order.status === 'refunded' || order.status === 'pending') && (
                        <span className="admin-order-action-empty">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-footer">
        <Link to="/admin">대시보드로</Link>
      </div>
    </div>
  )
}
