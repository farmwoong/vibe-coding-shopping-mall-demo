import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { productsApi, cartApi } from '../lib/api'
import { CATEGORY_NAV } from '../lib/categories'

export default function Products() {
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [quantityByProduct, setQuantityByProduct] = useState({})

  const handleAddToCart = async (e, productId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    const qty = Math.max(1, Math.min(99, quantityByProduct[productId] || 1))
    setAddingId(productId)
    try {
      await cartApi.addItem({ productId, quantity: qty })
      refreshCart()
      navigate('/cart')
    } catch (err) {
      setError(err.message || '장바구니 담기에 실패했습니다.')
    } finally {
      setAddingId(null)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [category])

  useEffect(() => {
    setLoading(true)
    const apiCategory = category && category !== 'all' ? category : undefined
    productsApi
      .list({ page, limit: 10, category: apiCategory })
      .then((data) => {
        setProducts(data.products ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)
      })
      .catch((e) => setError(e.message || '목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [category, page])

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>체육관 목록</h1>
        <p className="products-desc">등록된 체육관을 둘러보세요.</p>
      </div>

      <nav className="products-category-nav">
        {CATEGORY_NAV.map(({ id, label, value }) => {
          const isActive = (value && category === value) || (!value && !category)
          return (
            <button
              key={id}
              type="button"
              className={`products-category-tab ${isActive ? 'products-category-tab--active' : ''}`}
              onClick={() => {
                setSearchParams(value ? { category: value } : {})
                setPage(1)
              }}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {loading ? (
        <p className="products-loading">로딩 중...</p>
      ) : error ? (
        <p className="products-error">{error}</p>
      ) : products.length === 0 ? (
        <p className="products-empty">등록된 체육관이 없습니다.</p>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <div key={p._id} className="products-card">
              <Link to={`/products/${p._id}`} className="products-card-link">
                {p.image ? (
                  <img src={p.image} alt="" className="home-product-img home-product-img-real" />
                ) : (
                  <div className="home-product-img" />
                )}
                <p className="home-product-name">{p.name}</p>
                <p className="home-product-price">₩{Number(p.price).toLocaleString()}</p>
              </Link>
              <div className="products-cart-row">
                <label className="products-quantity-label">인원</label>
                <select
                  value={quantityByProduct[p._id] ?? 1}
                  onChange={(e) => {
                    e.stopPropagation()
                    setQuantityByProduct((prev) => ({ ...prev, [p._id]: Number(e.target.value) }))
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="products-quantity-select"
                  aria-label="인원 수"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}명</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="products-cart-btn"
                  onClick={(e) => handleAddToCart(e, p._id)}
                  disabled={!!addingId}
                >
                  {addingId === p._id ? '담는 중...' : '장바구니 담기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav className="pagination" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="이전 페이지"
          >
            이전
          </button>
          <span className="pagination-info">
            {page} / {totalPages} (총 {total}개)
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </nav>
      )}

      <div className="products-footer">
        <Link to="/">홈으로</Link>
      </div>
    </div>
  )
}
