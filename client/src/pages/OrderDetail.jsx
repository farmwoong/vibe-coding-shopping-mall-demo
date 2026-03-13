import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersApi } from '../lib/api'

function formatDate(d) {
  if (!d) return '-'
  const x = new Date(d)
  return x.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!id) {
      setLoading(false)
      return
    }
    ordersApi
      .getById(id)
      .then(setOrder)
      .catch((e) => setError(e.message || '주문을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [id, user, navigate])

  if (!user) return null
  if (loading) return <div className="order-detail-page"><p>로딩 중...</p></div>
  if (error || !order) {
    return (
      <div className="order-detail-page">
        <p className="order-error">{error || '주문을 찾을 수 없습니다.'}</p>
        <Link to="/orders">주문 목록</Link>
      </div>
    )
  }

  const items = order.items ?? []
  return (
    <div className="order-detail-page">
      <header className="order-header">
        <button type="button" className="order-back" onClick={() => navigate(-1)} aria-label="뒤로">←</button>
        <h1 className="order-title">주문 상세</h1>
      </header>
      <div className="order-detail-block">
        <p className="order-detail-number">주문번호 {order.orderNumber}</p>
        <p className="order-detail-status">상태: {order.status}</p>
        <ul className="order-detail-items">
          {items.map((item, i) => (
            <li key={i} className="order-detail-item">
              <span className="order-detail-item-name">{item.productName}</span>
              <span className="order-detail-item-meta">
                {formatDate(item.selectedDate)} · {item.quantity}명 · ₩{Number(item.unitPrice).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <p className="order-detail-total">총 결제 금액 ₩{Number(order.totalAmount).toLocaleString()}</p>
      </div>
      <div className="order-detail-actions">
        <Link to="/orders" className="order-btn-secondary">주문 목록</Link>
      </div>
    </div>
  )
}
