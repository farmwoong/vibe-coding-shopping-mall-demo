import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersApi, usersApi } from '../lib/api'

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

function getStatusLabel(status) {
  const map = { pending: '대기', paid: '결제완료', completed: '수업 완료', cancelled: '취소', refunded: '환불' }
  return map[status] ?? status
}

export default function AdminMemberList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const loadMembers = (silent = false) => {
    if (!silent) setLoading(true)
    ordersApi
      .getAdminMembers()
      .then((res) => setMembers(res.members ?? []))
      .catch((e) => setError(e.message || '회원 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.user_type !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    loadMembers()
  }, [user, navigate])

  const handleUserTypeChange = async (userId, newType) => {
    if (updatingUserId) return
    if (!window.confirm(`${newType === 'admin' ? '관리자' : '일반 회원'}로 변경하시겠습니까?`)) return
    setUpdatingUserId(userId)
    try {
      await usersApi.updateUserType(userId, newType)
      loadMembers(true)
    } catch (e) {
      alert(e.message || '등급 변경에 실패했습니다.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (!user || user.user_type !== 'admin') return null

  if (loading) {
    return (
      <div className="admin-page">
        <p className="admin-loading">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-error">{error}</p>
        <Link to="/admin">대시보드로</Link>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>회원 목록</h1>
        <p className="admin-desc">회원별 예약 현황을 확인하세요.</p>
      </div>

      <div className="admin-member-list">
        {members.length === 0 ? (
          <p className="admin-loading">등록된 회원이 없습니다.</p>
        ) : (
          <div className="admin-member-cards">
            {members.map(({ user: u, orders }) => {
              const isExpanded = expandedId === u._id
              const bookings = orders.flatMap((order) =>
                (order.items ?? []).map((item) => ({
                  ...item,
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  orderStatus: order.status,
                }))
              )

              return (
                <div key={u._id} className="admin-member-card">
                  <button
                    type="button"
                    className="admin-member-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : u._id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="admin-member-card-info">
                      <span className="admin-member-card-name">{u.name}</span>
                      <span className="admin-member-card-email">{u.email}</span>
                      <select
                        className="admin-member-card-type-select"
                        value={u.user_type || 'customer'}
                        onChange={(e) => handleUserTypeChange(u._id, e.target.value)}
                        disabled={updatingUserId === u._id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="customer">일반 회원</option>
                        <option value="admin">관리자</option>
                      </select>
                    </div>
                    <div className="admin-member-card-meta">
                      <span className="admin-member-card-count">예약 {bookings.length}건</span>
                      <span className="admin-member-card-chevron">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="admin-member-card-body">
                      {bookings.length === 0 ? (
                        <p className="admin-member-empty">예약 내역이 없습니다.</p>
                      ) : (
                        <ul className="admin-member-bookings">
                          {bookings.map((b, idx) => {
                            const product = b.product
                            const name = product?.name ?? b.productName ?? '상품'
                            return (
                              <li key={`${b.orderId}-${idx}`} className="admin-member-booking">
                                <div className="admin-member-booking-info">
                                  <span className="admin-member-booking-name">{name}</span>
                                  <span className="admin-member-booking-datetime">
                                    {formatDateLabel(b.selectedDate)} {formatTimeLabel(b.selectedTime)} ·{' '}
                                    {b.quantity}명
                                  </span>
                                  <span
                                    className={`admin-member-booking-status admin-member-booking-status--${b.orderStatus}`}
                                  >
                                    {getStatusLabel(b.orderStatus)}
                                  </span>
                                </div>
                                <Link
                                  to={`/orders/${b.orderId}`}
                                  className="admin-table-link admin-member-booking-link"
                                >
                                  상세
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="admin-footer">
        <Link to="/admin">대시보드로</Link>
      </div>
    </div>
  )
}
