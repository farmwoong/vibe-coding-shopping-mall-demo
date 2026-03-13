import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ordersApi } from '../lib/api'

function formatDate(d) {
  if (!d) return '-'
  const x = new Date(d)
  return x.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })
}

export default function Orders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    ordersApi
      .getMyOrders()
      .then((res) => setOrders(res.orders ?? []))
      .catch((e) => setError(e.message || '주문 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user) return null
  if (loading) return <div className="orders-page"><p className="orders-loading">로딩 중...</p></div>
  if (error) return <div className="orders-page"><p className="orders-error">{error}</p><Link to="/">홈</Link></div>

  return (
    <div className="orders-page">
      <h1 className="orders-title">주문 목록</h1>
      {orders.length === 0 ? (
        <p className="orders-empty">주문 내역이 없습니다.</p>
      ) : (
        <ul className="orders-list">
          {orders.map((o) => (
            <li key={o._id} className="orders-item">
              <Link to={`/orders/${o._id}`} className="orders-item-link">
                <span className="orders-item-number">{o.orderNumber}</span>
                <span className="orders-item-date">{formatDate(o.createdAt)}</span>
                <span className="orders-item-amount">₩{Number(o.totalAmount).toLocaleString()}</span>
                <span className="orders-item-status">{o.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="orders-footer">
        <Link to="/products" className="order-btn-secondary">상품 둘러보기</Link>
      </div>
    </div>
  )
}
