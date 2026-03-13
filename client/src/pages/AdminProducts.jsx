import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { productsApi } from '../lib/api'

const PER_PAGE = 10

export default function AdminProducts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.user_type !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    setLoading(true)
    productsApi
      .list({ page, limit: PER_PAGE })
      .then((data) => {
        setProducts(data.products ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)
      })
      .catch((e) => setError(e.message || '목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user, navigate, page])

  if (!user || user.user_type !== 'admin') {
    return null
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>체육관(상품) 관리</h1>
        <p className="admin-desc">등록된 체육관 목록입니다.</p>
      </div>

      <div className="admin-actions">
        <Link to="/admin/products/new" className="admin-btn-primary">
          새 체육관 등록
        </Link>
      </div>

      {loading ? (
        <p className="admin-loading">로딩 중...</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>SKU</th>
                <th>체육관명</th>
                <th>일일권 가격</th>
                <th>카테고리</th>
                <th>주소</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7}>등록된 체육관이 없습니다.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td className="admin-table-img-cell">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className="admin-table-img"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span className="admin-table-img-placeholder">없음</span>
                      )}
                    </td>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>₩{Number(p.price).toLocaleString()}</td>
                    <td>{p.category}</td>
                    <td className="admin-table-desc">{p.address || '-'}</td>
                    <td>
                      <Link to={`/admin/products/${p._id}/edit`} className="admin-table-link">
                        수정
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" style={{ marginTop: '1rem' }}>
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

      <div className="admin-footer">
        <Link to="/admin">대시보드로</Link>
      </div>
    </div>
  )
}
