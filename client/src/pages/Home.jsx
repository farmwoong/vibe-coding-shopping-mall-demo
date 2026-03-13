import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../lib/api'

const SHOP_TABS = [
  { id: 'event', label: 'Event' },
  { id: 'steady', label: 'Steady' },
]

export default function Home() {
  const [shopTab, setShopTab] = useState('event')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi
      .list({ limit: 0 })
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const displayProducts = products.slice(0, 6)

  return (
    <div className="home-btwin">
      <section className="home-hero-btwin">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <h1 className="home-hero-title">강한 하루 :<br className="hero-br-mobile" /> STRONG DAY</h1>
          <Link to="/products" className="home-hero-cta">수업 예약하기</Link>
        </div>
      </section>

      <section className="home-shop-in">
        <div className="home-shop-tabs">
          {SHOP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`home-shop-tab ${shopTab === tab.id ? 'active' : ''}`}
              onClick={() => setShopTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="home-shop-carousel">
          <div className="home-shop-track">
            {loading ? (
              <p className="home-shop-loading">로딩 중...</p>
            ) : displayProducts.length === 0 ? (
              <p className="home-shop-empty">등록된 체육관이 없습니다.</p>
            ) : (
              displayProducts.map((p) => (
                <Link key={p._id} to={`/products/${p._id}`} className="home-product-card">
                  {p.image ? (
                    <img src={p.image} alt="" className="home-product-img home-product-img-real" />
                  ) : (
                    <div className="home-product-img" />
                  )}
                  <p className="home-product-name">{p.name}</p>
                  <p className="home-product-price">₩{Number(p.price).toLocaleString()}</p>
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="home-shop-viewall">
          <Link to="/products" className="home-viewall-btn">VIEW ALL</Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <nav className="home-footer-nav">
            <a href="#terms">이용약관</a>
            <a href="#privacy">개인정보처리방침</a>
            <a href="#guide">이용안내</a>
          </nav>
          <div className="home-footer-info">
            <p>주식회사 PT체험 | 대표이사 홍길동 | 사업자등록번호 000-00-00000</p>
            <p>서울특별시 강남구 테헤란로 123 | 고객센터 1234-5678</p>
            <p className="home-footer-copy">© PT체험. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
