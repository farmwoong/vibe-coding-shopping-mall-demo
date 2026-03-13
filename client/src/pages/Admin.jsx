import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi, productsApi, ordersApi } from '../lib/api'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [orderCount, setOrderCount] = useState(0)
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
    Promise.all([
      usersApi.list(),
      productsApi.list({ limit: 0 }),
      ordersApi.getAdminOrders().catch(() => ({ orders: [], total: 0 })),
    ])
      .then(([userList, productRes, orderRes]) => {
        setUsers(Array.isArray(userList) ? userList : [])
        setProducts(productRes.products ?? [])
        setOrderCount(orderRes?.total ?? 0)
      })
      .catch((err) => setError(err.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user || user.user_type !== 'admin') {
    return null
  }

  const recentUsers = [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5)
  const recentProducts = [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <p className="admin-desc">강한하루 현황을 한눈에 확인하세요.</p>
      </div>

      {loading ? (
        <p className="admin-loading">로딩 중...</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : (
        <>
          <div className="admin-actions">
            <Link to="/admin/products/new" className="admin-btn-primary">새 체육관 등록하기</Link>
          </div>

          <div className="admin-cards">
            <div className="admin-card">
              <span className="admin-card-label">총 회원 수</span>
              <span className="admin-card-value">{users.length}</span>
              <Link to="/admin/members" className="admin-card-link">회원 목록</Link>
            </div>
            <div className="admin-card">
              <span className="admin-card-label">총 체육관 수</span>
              <span className="admin-card-value">{products.length}</span>
              <Link to="/admin/products" className="admin-card-link">체육관 목록</Link>
            </div>
            <div className="admin-card">
              <span className="admin-card-label">총 주문 수</span>
              <span className="admin-card-value">{orderCount}</span>
              <Link to="/admin/orders" className="admin-card-link">주문 관리</Link>
            </div>
          </div>

          <div className="admin-tables">
            <section className="admin-section">
              <h2>최근 가입 회원</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>이메일</th>
                      <th>유형</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3}>가입 회원이 없습니다.</td>
                      </tr>
                    ) : (
                      recentUsers.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.user_type === 'admin' ? '관리자' : '일반'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-section">
              <h2>최근 등록 체육관</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>체육관명</th>
                      <th>일일권 가격</th>
                      <th>설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3}>등록된 체육관이 없습니다.</td>
                      </tr>
                    ) : (
                      recentProducts.map((p) => (
                        <tr key={p._id}>
                          <td>{p.name}</td>
                          <td>₩{Number(p.price).toLocaleString()}</td>
                          <td className="admin-table-desc">{p.description || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="admin-footer">
            <Link to="/">홈으로</Link>
          </div>
        </>
      )}
    </div>
  )
}
