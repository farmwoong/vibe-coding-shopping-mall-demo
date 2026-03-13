import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartApi } from '../lib/api'

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refreshCart } = useCart()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    cartApi
      .getCart()
      .then(setCart)
      .catch((e) => setError(e.message || '장바구니를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="cart-page">
        <div className="cart-empty-state">
          <h1 className="cart-title">장바구니</h1>
          <p className="cart-message">로그인 후 장바구니를 확인할 수 있습니다.</p>
          <Link to="/login" className="cart-btn-primary">로그인</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cart-page">
        <p className="cart-loading">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart-page">
        <p className="cart-error">{error}</p>
        <Link to="/products" className="cart-link">상품 목록으로</Link>
      </div>
    )
  }

  const handleRemove = async (itemId) => {
    try {
      const updated = await cartApi.removeItem(itemId)
      setCart(updated)
      refreshCart()
    } catch (err) {
      setError(err.message || '삭제에 실패했습니다.')
    }
  }

  const handleQuantityChange = async (itemId, newQty) => {
    const qty = Math.max(1, Math.min(99, newQty))
    try {
      const updated = await cartApi.updateItem(itemId, { quantity: qty })
      setCart(updated)
      refreshCart()
    } catch (err) {
      setError(err.message || '수량 변경에 실패했습니다.')
    }
  }

  const items = cart?.items ?? []
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  )

  return (
    <div className="cart-page">
      <h1 className="cart-title">장바구니</h1>
      {items.length === 0 ? (
        <div className="cart-empty-state">
          <p className="cart-message">장바구니가 비어 있습니다.</p>
          <Link to="/products" className="cart-btn-primary">상품 둘러보기</Link>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => {
              const productId = item.product?._id ?? item.product
              const itemId = item._id
              const dateStr = item.selectedDate
              const dateLabel = dateStr
                ? (() => {
                    const d = new Date(dateStr + 'T12:00:00')
                    return `${d.getMonth() + 1}월 ${d.getDate()}일`
                  })()
                : '날짜 미선택'
              return (
                <li key={itemId} className="cart-item">
                  {item.product?.image ? (
                    <img
                      src={item.product.image}
                      alt=""
                      className="cart-item-img"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="cart-item-img cart-item-img--placeholder" />
                  )}
                  <div className="cart-item-info">
                    <Link to={`/products/${productId}`} className="cart-item-name">
                      {item.product?.name ?? '상품'}
                    </Link>
                    <p className="cart-item-meta">
                      ₩{Number(item.product?.price ?? 0).toLocaleString()} × 인원 · {dateLabel}
                    </p>
                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => handleQuantityChange(itemId, (item.quantity ?? 1) - 1)}
                        aria-label="인원 감소"
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => handleQuantityChange(itemId, (item.quantity ?? 1) + 1)}
                        aria-label="인원 증가"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="cart-item-subtotal">
                    ₩{Number((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => handleRemove(itemId)}
                    aria-label="장바구니에서 삭제"
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="cart-footer">
            <p className="cart-total">
              총 결제 예정 금액 <strong>₩{totalAmount.toLocaleString()}</strong>
            </p>
            <div className="cart-footer-actions">
              <Link to="/products" className="cart-btn-secondary">쇼핑 계속하기</Link>
              <button
                type="button"
                className="cart-btn-primary"
                onClick={() => navigate('/order')}
              >
                결제하기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
