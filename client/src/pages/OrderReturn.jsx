import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ordersApi, cartApi } from '../lib/api'

const PENDING_KEY_PREFIX = 'pending_order_'

export default function OrderReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    const impUid = searchParams.get('imp_uid')
    const merchantUid = searchParams.get('merchant_uid')
    const impSuccess = searchParams.get('imp_success')
    const success = searchParams.get('success')

    // KG이니시스 등 일부 PG는 imp_success 대신 success 전달
    const isSuccess = impSuccess === 'true' || success === 'true'

    if (!impUid || !merchantUid) {
      setError('결제 정보가 없습니다. 주문 내역에서 확인해 주세요.')
      setStatus('error')
      return
    }

    if (!isSuccess) {
      const errMsg = searchParams.get('error_msg') || '결제가 완료되지 않았습니다.'
      setError(`KG이니시스 결제 실패: ${errMsg}`)
      setStatus('error')
      return
    }

    const pendingKey = `${PENDING_KEY_PREFIX}${merchantUid}`
    let pendingData
    try {
      const raw = localStorage.getItem(pendingKey)
      pendingData = raw ? JSON.parse(raw) : null
    } catch (_) {
      pendingData = null
    }

    if (!pendingData?.items?.length || pendingData.totalAmount == null) {
      setError('세션이 만료되었거나 주문 정보를 찾을 수 없습니다. 결제는 완료되었을 수 있으니 내 예약 목록에서 확인해 주세요.')
      setStatus('error')
      return
    }

    ordersApi
      .create({
        items: pendingData.items,
        totalAmount: pendingData.totalAmount,
        imp_uid: impUid,
        merchant_uid: merchantUid,
      })
      .then(async (created) => {
        try {
          localStorage.removeItem(pendingKey)
        } catch (_) {}
        await cartApi.clearCart()
        refreshCart()
        setOrder(created)
        setStatus('success')
        navigate('/order/complete', { state: { order: created }, replace: true })
      })
      .catch((err) => {
        setError(err.message || '주문 처리에 실패했습니다. 결제는 완료되었을 수 있으니 내 예약 목록에서 확인해 주세요.')
        setStatus('error')
      })
  }, [user, searchParams, navigate, refreshCart])

  if (!user) return null

  if (status === 'loading') {
    return (
      <div className="order-page">
        <p className="order-loading">결제 확인 중...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="order-page">
        <h2 className="order-error-title">KG이니시스 결제 실패 → 결제 실패 알림</h2>
        <p className="order-error">{error}</p>
        <Link to="/orders" className="order-link">내 예약 목록</Link>
        <Link to="/cart" className="order-link">장바구니</Link>
      </div>
    )
  }

  return (
    <div className="order-page">
      <p className="order-loading">주문 완료 처리 중...</p>
    </div>
  )
}
