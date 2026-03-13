import { Link, useLocation, useNavigate } from 'react-router-dom'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(dateVal) {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const w = WEEKDAYS[d.getDay()]
  return `${y}. ${m}. ${day} (${w})`
}

function formatTimeLabel(time) {
  if (!time) return '오전 9:00'
  const [h, min] = String(time).split(':')
  const hour = parseInt(h, 10)
  if (hour >= 12) return `오후 ${hour === 12 ? 12 : hour - 12}:${(min || '00').padStart(2, '0')}`
  return `오전 ${hour}:${(min || '00').padStart(2, '0')}`
}

/** 예약일 당일 D-Day, 예약일 다음날부터 방문완료 */
function daysUntil(dateVal) {
  if (!dateVal) return 0
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return 0
  const resDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (resDate < todayStr) return -1
  if (resDate === todayStr) return 0
  const res = new Date(resDate + 'T12:00:00')
  const t = new Date(todayStr + 'T12:00:00')
  return Math.ceil((res - t) / (1000 * 60 * 60 * 24))
}

export default function OrderComplete() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const order = state?.order
  const items = order?.items ?? []

  return (
    <div className="order-complete-page">
      <header className="order-complete-header">
        <h1 className="order-complete-header-title">강한하루</h1>
        <nav className="order-complete-tabs">
          <span className="order-complete-tab order-complete-tab--active">나의 예약</span>
          <Link to="/orders" className="order-complete-tab">나의 알림</Link>
        </nav>
      </header>

      <section className="order-complete-success">
        <h2 className="order-complete-title">KG이니시스 결제 성공 → 주문 생성</h2>
        <p className="order-complete-desc">
          결제가 완료되었습니다. 아래에서 예약 내역을 확인할 수 있습니다.
        </p>
      </section>

      {items.length > 0 ? (
        <section className="order-complete-status">
          <div className="order-complete-status-tabs">
            <span className="order-complete-status-tab order-complete-status-tab--active">방문예정</span>
            <span className="order-complete-status-tab">방문완료</span>
            <span className="order-complete-status-tab">취소/노쇼</span>
          </div>

          <ul className="order-complete-cards">
            {items.map((item, idx) => {
              const product = item.product
              const name = product?.name ?? item.productName ?? '상품'
              const category = product?.category ?? ''
              const address = product?.address ?? ''
              const image = product?.image
              const dateStr = item.selectedDate
              const time = item.selectedTime || '09:00'
              const quantity = item.quantity ?? 1
              const d = daysUntil(dateStr)

              return (
                <li key={item._id || idx} className="order-complete-card">
                  <div className="order-complete-card-badge">
                    {d > 0 ? `D-${d}` : d === 0 ? 'D-Day' : '방문완료'}
                  </div>
                  <div className="order-complete-card-body">
                    <div className="order-complete-card-thumb">
                      {image ? (
                        <img src={image} alt="" />
                      ) : (
                        <span className="order-complete-card-placeholder">{name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="order-complete-card-info">
                      <h3 className="order-complete-card-name">{name}</h3>
                      <p className="order-complete-card-meta">
                        {[category, address].filter(Boolean).join(' • ')}
                      </p>
                      <p className="order-complete-card-datetime">
                        {formatDateLabel(dateStr)} • {formatTimeLabel(time)} • {quantity}명
                      </p>
                    </div>
                    <button
                      type="button"
                      className="order-complete-card-share"
                      aria-label="공유"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                    </button>
                  </div>
                  <Link
                    to={order?._id ? `/orders/${order._id}` : '/orders'}
                    className="order-complete-card-action"
                  >
                    예약 상세 보기
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p className="order-complete-no-items">
          예약 내역을 불러올 수 없습니다. <Link to="/orders">내 예약 목록</Link>에서 확인해 보세요.
        </p>
      )}

      <section className="order-complete-promo">
        <p className="order-complete-promo-title">전화예약도 앱에서 확인하기</p>
        <p className="order-complete-promo-desc">전화로 한 예약도 마이페이지에서 확인할 수 있어요!</p>
        <Link to="/orders/status" className="order-complete-promo-link">수업 예약 현황 보기 →</Link>
      </section>

      <div className="order-complete-actions">
        <Link to="/products" className="order-complete-btn order-complete-btn--secondary">
          다른 체험 둘러보기
        </Link>
        <button
          type="button"
          className="order-complete-btn order-complete-btn--primary"
          onClick={() => navigate('/orders/status')}
        >
          수업 예약 현황 보기
        </button>
      </div>
    </div>
  )
}
