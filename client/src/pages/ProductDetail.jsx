import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { productsApi, cartApi } from '../lib/api'
import { savePendingAdd } from '../lib/pendingAdd'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = WEEKDAYS[d.getDay()]
  return `${m}월 ${day}일 (${w})`
}

function AvailableDatesCalendar({ availableDates, selectedDate, onSelect, viewYear, viewMonth, onPrevMonth, onNextMonth }) {
  const datesSet = new Set(availableDates || [])
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startPad = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const weeks = []
  let week = []
  for (let i = 0; i < startPad; i++) week.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    week.push(dateStr)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return (
    <div className="product-detail-calendar">
      <div className="product-detail-calendar-header">
        <button type="button" className="product-detail-calendar-nav" onClick={onPrevMonth} aria-label="이전 달">
          ‹
        </button>
        <span className="product-detail-calendar-title">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button type="button" className="product-detail-calendar-nav" onClick={onNextMonth} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="product-detail-calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="product-detail-calendar-weekday">{w}</span>
        ))}
      </div>
      <div className="product-detail-calendar-grid">
        {weeks.map((row, ri) =>
          row.map((dateStr, ci) => {
            const available = dateStr && datesSet.has(dateStr)
            const selected = dateStr && dateStr === selectedDate
            return (
              <button
                key={ri * 7 + ci}
                type="button"
                className={`product-detail-calendar-day ${!dateStr ? 'empty' : ''} ${available ? 'available' : 'disabled'} ${selected ? 'selected' : ''}`}
                disabled={!available}
                onClick={() => available && onSelect(dateStr)}
              >
                {dateStr ? new Date(dateStr + 'T12:00:00').getDate() : ''}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingCart, setAddingCart] = useState(false)
  const [cartError, setCartError] = useState('')
  const [cartQuantity, setCartQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [calendarView, setCalendarView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const handleAddToCart = async () => {
    if (!product?._id) return
    if (!selectedDate) {
      setCartError('이용일을 선택해 주세요.')
      return
    }
    const qty = Math.max(1, Math.min(99, cartQuantity))
    if (!user) {
      savePendingAdd({ productId: product._id, quantity: qty, selectedDate })
      navigate('/login', { state: { from: `/products/${product._id}` } })
      return
    }
    setAddingCart(true)
    setCartError('')
    try {
      await cartApi.addItem({ productId: product._id, quantity: qty, selectedDate })
      refreshCart()
      navigate('/cart')
    } catch (err) {
      setCartError(err.message || '장바구니 담기에 실패했습니다.')
    } finally {
      setAddingCart(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    productsApi
      .get(id)
      .then(setProduct)
      .catch((e) => setError(e.message || '체육관 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!product?._id) return
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 60)
    productsApi
      .getAvailableDates(product._id, {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      })
      .then((res) => setAvailableDates(res.dates || []))
      .catch(() => setAvailableDates([]))
  }, [product?._id])

  if (loading) return <div className="product-detail product-detail--loading">로딩 중...</div>
  if (error) {
    return (
      <div className="product-detail product-detail--error">
        <p>{error}</p>
        <button type="button" onClick={() => navigate(-1)}>이전으로</button>
      </div>
    )
  }
  if (!product) return null

  return (
    <div className="product-detail">
      <nav className="product-detail-breadcrumb">
        <Link to="/">홈</Link>
        <span className="product-detail-breadcrumb-sep">&gt;</span>
        <Link to="/products">체육관</Link>
        <span className="product-detail-breadcrumb-sep">&gt;</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail-main">
        <aside className="product-detail-gallery">
          <div className="product-detail-image-wrap">
            {product.image ? (
              <img src={product.image} alt="" className="product-detail-image" />
            ) : (
              <div className="product-detail-image product-detail-image--placeholder" />
            )}
          </div>
          <div className="product-detail-card">
            <div className="product-detail-card-avatar" />
            <div className="product-detail-card-info">
              <strong className="product-detail-card-name">{product.name}</strong>
              <p className="product-detail-card-meta">
                {product.address || '주소 없음'} · {product.category}
              </p>
            </div>
          </div>
        </aside>

        <article className="product-detail-content">
          <h1 className="product-detail-title">{product.name} 소개</h1>
          <p className="product-detail-meta">
            {product.category} · 일일권 ₩{Number(product.price).toLocaleString()}
          </p>
          {product.description ? (
            <div className="product-detail-description">
              {product.description.split(/\n+/).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="product-detail-description product-detail-description--empty">
              등록된 소개가 없습니다.
            </p>
          )}

          {(product.address || product.name) && (
            <section className="product-detail-map">
              <h2 className="product-detail-cta-title">위치</h2>
              {product.address && (
                <p className="product-detail-map-address">{product.address}</p>
              )}
              <div className="product-detail-map-actions">
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-detail-map-btn product-detail-map-btn--naver"
                >
                  네이버 지도에서 보기
                </a>
                <a
                  href={`https://map.kakao.com/?q=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-detail-map-btn product-detail-map-btn--kakao"
                >
                  카카오맵에서 보기
                </a>
              </div>
            </section>
          )}

          <section className="product-detail-available-dates">
            <h2 className="product-detail-cta-title">이용일 선택</h2>
            <p className="product-detail-available-desc">
              예약 가능한 날짜를 선택하고 장바구니에 담아주세요.
              {selectedDate && (
                <span className="product-detail-selected-date"> · 선택: {formatDateLabel(selectedDate)}</span>
              )}
            </p>
            <p className="product-detail-daily-price">
              일일권 가격 <strong>₩{Number(product.price).toLocaleString()}</strong> (1일 이용)
            </p>
            <AvailableDatesCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              viewYear={calendarView.year}
              viewMonth={calendarView.month}
              onPrevMonth={() =>
                setCalendarView((prev) =>
                  prev.month === 0
                    ? { year: prev.year - 1, month: 11 }
                    : { ...prev, month: prev.month - 1 }
                )
              }
              onNextMonth={() =>
                setCalendarView((prev) =>
                  prev.month === 11
                    ? { year: prev.year + 1, month: 0 }
                    : { ...prev, month: prev.month + 1 }
                )
              }
            />
            <div className="product-detail-booking-row">
              <div className="product-detail-quantity-wrap">
                <label className="product-detail-quantity-label">인원</label>
                <select
                  value={cartQuantity}
                  onChange={(e) => setCartQuantity(Number(e.target.value))}
                  className="product-detail-quantity-select"
                  aria-label="인원 수"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}명</option>
                  ))}
                </select>
              </div>
              <p className="product-detail-total-price">
                총 금액 <strong>₩{Number(product.price * cartQuantity).toLocaleString()}</strong>
              </p>
              <button
                type="button"
                className="product-detail-card-btn"
                onClick={handleAddToCart}
                disabled={addingCart || !selectedDate}
              >
                {addingCart ? '담는 중...' : selectedDate ? '장바구니 담기' : '날짜 선택 후 담기'}
              </button>
            </div>
          </section>

          <section className="product-detail-cta">
            <h2 className="product-detail-cta-title">이용 안내</h2>
            {product.address && (
              <p className="product-detail-address">
                <span className="product-detail-label">주소</span> {product.address}
              </p>
            )}
          </section>

          <div className="product-detail-footer">
            <Link to="/products" className="product-detail-link">체육관 목록 보기</Link>
            {cartError && <p className="product-detail-cart-error">{cartError}</p>}
          </div>
        </article>
      </div>
    </div>
  )
}
