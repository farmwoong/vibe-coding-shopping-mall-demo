import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartApi, productsApi, ordersApi } from '../lib/api'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = WEEKDAYS[d.getDay()]
  return `${m}월 ${day}일 (${w})`
}

function OrderDateCalendar({ availableDates, selectedDate, onSelect, onClose, triggerRef, isLoading }) {
  const datesSet = new Set(availableDates || [])
  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T12:00:00')
      return d.getFullYear()
    }
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T12:00:00')
      return d.getMonth()
    }
    return new Date().getMonth()
  })
  const calendarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

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

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  if (isLoading) {
    return (
      <div className="order-calendar-dropdown order-calendar-loading" ref={calendarRef}>
        <p className="order-calendar-loading-text">날짜 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="order-calendar-dropdown" ref={calendarRef}>
      <div className="order-calendar-header">
        <button type="button" className="order-calendar-nav" onClick={prevMonth} aria-label="이전 달">
          ‹
        </button>
        <span className="order-calendar-title">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button type="button" className="order-calendar-nav" onClick={nextMonth} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="order-calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="order-calendar-weekday">{w}</span>
        ))}
      </div>
      <div className="order-calendar-grid">
        {weeks.map((row, ri) =>
          row.map((dateStr, ci) => {
            const available = dateStr && datesSet.has(dateStr)
            const selected = dateStr && dateStr === selectedDate
            return (
              <button
                key={ri * 7 + ci}
                type="button"
                className={`order-calendar-day ${!dateStr ? 'empty' : ''} ${available ? 'available' : 'disabled'} ${selected ? 'selected' : ''}`}
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

export default function Order() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refreshCart } = useCart()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [itemSelections, setItemSelections] = useState({})
  const [datesByProduct, setDatesByProduct] = useState({})
  const [openCalendarItemId, setOpenCalendarItemId] = useState(null)
  const dateTriggerRefs = useRef({})

  const [bookerName, setBookerName] = useState('')
  const [bookerPhone, setBookerPhone] = useState('')
  const [requests, setRequests] = useState('')
  const [agreeRequired, setAgreeRequired] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    setBookerName(user.name || '')
    setLoading(true)
    cartApi
      .getCart()
      .then((c) => {
        setCart(c)
        const initialSelections = {}
        ;(c?.items ?? []).forEach((i) => {
          if (i._id) {
            initialSelections[i._id] = { selectedDate: i.selectedDate || '' }
          }
        })
        setItemSelections(initialSelections)
        const ids = (c?.items ?? []).map((i) => i.product?._id ?? i.product).filter(Boolean)
        ids.forEach((id) => {
          const from = new Date()
          const to = new Date()
          to.setDate(to.getDate() + 60)
          productsApi
            .getAvailableDates(id, {
              from: from.toISOString().slice(0, 10),
              to: to.toISOString().slice(0, 10),
            })
            .then((res) => setDatesByProduct((prev) => ({ ...prev, [id]: res.dates || [] })))
            .catch(() => setDatesByProduct((prev) => ({ ...prev, [id]: [] })))
        })
      })
      .catch((e) => setError(e.message || '장바구니를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  // 포트원(아임포트) 결제 모듈 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && window.IMP) {
      window.IMP.init('imp30835352')
    }
  }, [])

  const setSelection = (itemId, field, value) => {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value },
    }))
  }

  const items = cart?.items ?? []
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
    0
  )

  const allSelected = items.every((item) => {
    const itemId = item._id
    const s = itemSelections[itemId]
    return !!(s?.selectedDate || item.selectedDate)
  })
  const canSubmit =
    allSelected &&
    bookerName.trim() &&
    bookerPhone.trim() &&
    agreeRequired &&
    !submitting

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setSubmitting(true)

    const orderItems = items.map((item) => {
      const productId = item.product?._id ?? item.product
      const s = itemSelections[item._id]
      const selectedDate = s?.selectedDate || item.selectedDate
      return {
        productId,
        quantity: item.quantity,
        selectedDate,
      }
    })

    const merchantUid = `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const orderName = items.length === 1
      ? (items[0].product?.name ?? '강한하루 예약')
      : `강한하루 예약 외 ${items.length - 1}건`

    // 리다이렉트 결제(네이버페이 등) 시 콜백이 실행되지 않으므로, 주문 데이터를 저장해두고
    // m_redirect_url로 돌아온 페이지에서 주문 완료 처리
    // localStorage 사용: 팝업/리다이렉트 창은 sessionStorage를 공유하지 않음
    const pendingKey = `pending_order_${merchantUid}`
    try {
      localStorage.setItem(pendingKey, JSON.stringify({ items: orderItems, totalAmount }))
    } catch (_) {}

    if (!window.IMP) {
      setError('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.')
      setSubmitting(false)
      return
    }

    window.IMP.request_pay(
      {
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: orderName,
        amount: totalAmount,
        buyer_name: bookerName.trim(),
        buyer_tel: bookerPhone.trim(),
        m_redirect_url: `${window.location.origin}/order/return`,
      },
      async (rsp) => {
        try {
          if (rsp.success) {
            const created = await ordersApi.create({
              items: orderItems,
              totalAmount,
              imp_uid: rsp.imp_uid,
              merchant_uid: rsp.merchant_uid,
            })
            try {
              localStorage.removeItem(pendingKey)
            } catch (_) {}
            await cartApi.clearCart()
            refreshCart()
            navigate('/order/complete', { state: { order: created }, replace: true })
          } else {
            if (rsp.error_code === 'PAY_CANCEL') {
              setError('KG이니시스 결제 실패: 결제가 취소되었습니다.')
            } else {
              setError(`KG이니시스 결제 실패: ${rsp.error_msg || '결제에 실패했습니다.'}`)
            }
          }
        } catch (err) {
          setError(err.message || '주문 처리에 실패했습니다.')
        } finally {
          setSubmitting(false)
        }
      }
    )
  }

  if (!user) return null
  if (loading) {
    return (
      <div className="order-page">
        <p className="order-loading">로딩 중...</p>
      </div>
    )
  }
  if (error && !cart) {
    return (
      <div className="order-page">
        <p className="order-error">{error}</p>
        <Link to="/cart" className="order-link">장바구니로</Link>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="order-page">
        <div className="order-empty">
          <p>장바구니가 비어 있습니다.</p>
          <Link to="/products" className="order-btn-primary">상품 둘러보기</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="order-page">
      <header className="order-header">
        <button type="button" className="order-back" onClick={() => navigate(-1)} aria-label="뒤로">
          ←
        </button>
        <h1 className="order-title">수업 예약</h1>
      </header>

      <form onSubmit={handleSubmit} className="order-form">
        <section className="order-section order-section--info">
          <h2 className="order-section-title">예약 정보</h2>
          <p className="order-section-desc">각 수업의 이용일(요일)을 선택해 주세요.</p>
          {items.map((item) => {
            const productId = item.product?._id ?? item.product
            const itemId = item._id
            const dates = datesByProduct[productId] ?? []
            const sel = itemSelections[itemId] || {}
            const displayDate = sel.selectedDate || item.selectedDate || ''
            return (
              <div key={itemId} className="order-item-block">
                <div className="order-item-head">
                  <span className="order-item-name">{item.product?.name ?? '상품'}</span>
                  <span className="order-item-meta">
                    ₩{Number(item.product?.price ?? 0).toLocaleString()} × {item.quantity}명
                  </span>
                </div>
                <div className="order-item-fields">
                  <div className="order-field order-field--date">
                    <label>이용일</label>
                    <div className="order-date-trigger-wrap">
                      <button
                        type="button"
                        ref={(el) => { dateTriggerRefs.current[itemId] = el }}
                        className="order-date-trigger"
                        onClick={() => setOpenCalendarItemId((prev) => (prev === itemId ? null : itemId))}
                        aria-expanded={openCalendarItemId === itemId}
                        aria-haspopup="dialog"
                      >
                        <span className="order-date-trigger-text">
                          {displayDate ? formatDateLabel(displayDate) : '날짜 선택'}
                        </span>
                        <span className="order-date-trigger-arrow">▼</span>
                      </button>
                      {openCalendarItemId === itemId && (
                        <OrderDateCalendar
                          availableDates={dates}
                          selectedDate={displayDate}
                          isLoading={!(productId in datesByProduct)}
                          onSelect={(dateStr) => {
                            setSelection(itemId, 'selectedDate', dateStr)
                            setOpenCalendarItemId(null)
                          }}
                          onClose={() => setOpenCalendarItemId(null)}
                          triggerRef={{ current: dateTriggerRefs.current[itemId] }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        <section className="order-section">
          <h2 className="order-section-title">예약자 정보</h2>
          <div className="order-field">
            <label>이름 <span className="required">*</span></label>
            <input
              type="text"
              value={bookerName}
              onChange={(e) => setBookerName(e.target.value)}
              placeholder="이름"
              required
            />
          </div>
          <div className="order-field">
            <label>휴대폰 번호 <span className="required">*</span></label>
            <input
              type="tel"
              value={bookerPhone}
              onChange={(e) => setBookerPhone(e.target.value)}
              placeholder="010-0000-0000"
              required
            />
            <span className="order-field-hint">예약 변경 시 확인에 사용됩니다.</span>
          </div>
          <div className="order-field">
            <label>요청사항 (선택)</label>
            <textarea
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="요청사항을 입력하세요"
              rows={3}
            />
          </div>
        </section>

        <section className="order-section order-section--terms">
          <h2 className="order-section-title">이용 및 약관 동의</h2>
          <label className="order-checkbox">
            <input
              type="checkbox"
              checked={agreeRequired}
              onChange={(e) => setAgreeRequired(e.target.checked)}
            />
            <span><strong>[필수]</strong> 예약 취소·변경 및 노쇼 규정에 동의합니다.</span>
          </label>
          <p className="order-terms-note">
            * 이용 2일 전부터 취소/노쇼 시 수수료가 부과될 수 있습니다.
          </p>
        </section>

        {error && <p className="order-error">{error}</p>}

        <div className="order-summary">
          <p className="order-total">
            총 결제 금액 <strong>₩{totalAmount.toLocaleString()}</strong>
          </p>
          <button type="submit" className="order-btn-pay" disabled={!canSubmit}>
            {submitting ? '처리 중...' : '결제하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
