import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersApi } from '../lib/api'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateVal) {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = WEEKDAYS[d.getDay()]
  return `${y}.${m}.${day} (${w})`
}

function formatTimeLabel(time) {
  if (!time) return '오전 9:00'
  const [h, min] = String(time).split(':')
  const hour = parseInt(h, 10)
  if (hour >= 12) return `오후 ${hour === 12 ? 12 : hour - 12}:${(min || '00').padStart(2, '0')}`
  return `오전 ${hour}:${(min || '00').padStart(2, '0')}`
}

/** 예약일 당일까지 방문예정, 예약일 다음날부터 방문완료 */
function isUpcoming(dateVal) {
  if (!dateVal) return true
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return true
  const resDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return resDate >= todayStr
}

const STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'upcoming', label: '예정' },
  { id: 'completed', label: '완료' },
  { id: 'cancelled', label: '취소/노쇼' },
]

export default function BookingStatus() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    ordersApi
      .getMyOrders()
      .then((res) => setOrders(res.orders ?? []))
      .catch((e) => setError(e.message || '예약 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const bookings = orders.flatMap((order) =>
    (order.items ?? []).map((item) => ({
      ...item,
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
    }))
  )

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'cancelled') return b.orderStatus === 'cancelled'
    if (b.orderStatus === 'cancelled') return false
    if (statusFilter === 'upcoming') return isUpcoming(b.selectedDate)
    if (statusFilter === 'completed') return !isUpcoming(b.selectedDate)
    return true
  })

  if (!user) return null
  if (loading) {
    return (
      <div className="booking-status-page">
        <p className="booking-status-loading">로딩 중...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="booking-status-page">
        <p className="booking-status-error">{error}</p>
        <Link to="/">홈으로</Link>
      </div>
    )
  }

  return (
    <div className="booking-status-page">
      <header className="booking-status-header">
        <h1 className="booking-status-title">수업 예약 현황</h1>
      </header>

      <div className="booking-status-tabs">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`booking-status-tab ${statusFilter === tab.id ? 'booking-status-tab--active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="booking-status-summary">
        <span className="booking-status-count">총 {filteredBookings.length}건</span>
        {user?.email && (
          <span className="booking-status-account">로그인: {user.email}</span>
        )}
      </div>

      {filteredBookings.length === 0 ? (
        <p className="booking-status-empty">
          {statusFilter === 'upcoming' && '예정된 수업이 없습니다.'}
          {statusFilter === 'completed' && '완료된 수업이 없습니다.'}
          {statusFilter === 'cancelled' && '취소/노쇼 내역이 없습니다.'}
          {statusFilter === 'all' && (
            <>
              예약 내역이 없습니다.
              {orders.length === 0 && user?.email && (
                <span className="booking-status-empty-hint">
                  {' '}결제한 계정({user.email})으로 로그인했는지 확인해보세요.
                </span>
              )}
            </>
          )}
        </p>
      ) : (
        <ul className="booking-status-cards">
          {filteredBookings.map((booking, idx) => {
            const product = booking.product
            const name = product?.name ?? booking.productName ?? '상품'
            const category = product?.category ?? ''
            const address = product?.address ?? ''
            const image = product?.image
            const isUpc = isUpcoming(booking.selectedDate)
            const statusTag =
              booking.orderStatus === 'cancelled'
                ? '예약 취소'
                : isUpc
                  ? '예정 예약'
                  : '완료 예약'

            return (
              <li key={`${booking.orderId}-${idx}`} className="booking-status-card">
                <span
                  className={`booking-status-card-badge booking-status-card-badge--${booking.orderStatus === 'cancelled' ? 'cancelled' : isUpc ? 'upcoming' : 'completed'}`}
                >
                  {statusTag}
                </span>
                <div className="booking-status-card-body">
                  <div className="booking-status-card-thumb">
                    {image ? (
                      <img src={image} alt="" />
                    ) : (
                      <span className="booking-status-card-placeholder">{name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="booking-status-card-info">
                    <h3 className="booking-status-card-name">{name}</h3>
                    <p className="booking-status-card-meta">
                      {[category, address].filter(Boolean).join(' - ')}
                    </p>
                    <p className="booking-status-card-datetime">
                      {formatDateLabel(booking.selectedDate)} {formatTimeLabel(booking.selectedTime)} ·{' '}
                      {booking.quantity}명
                    </p>
                    {!isUpc && booking.orderStatus !== 'cancelled' && (
                      <p className="booking-status-card-review">리뷰 작성 기간이 만료되었어요</p>
                    )}
                  </div>
                </div>
                <Link
                  to={`/orders/${booking.orderId}`}
                  className="booking-status-card-action"
                >
                  예약 상세 보기
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="booking-status-footer">
        <Link to="/products" className="booking-status-btn">다른 수업 둘러보기</Link>
      </div>
    </div>
  )
}
