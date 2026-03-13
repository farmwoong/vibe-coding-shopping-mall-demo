import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../lib/api'

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [keepLogin, setKeepLogin] = useState(false)
  const [ipSecurity, setIpSecurity] = useState(true)
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setCheckingAuth(false)
      return
    }
    usersApi
      .getMe(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => setCheckingAuth(false))
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      // POST /api/users/login (server: usersController.login)
      const data = await usersApi.login({
        email: form.email.trim(),
        password: form.password,
      })
      if (!data.token) {
        setError('로그인 응답 오류입니다.')
        return
      }
      if (keepLogin) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user || {}))
      } else {
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('user', JSON.stringify(data.user || {}))
      }
      setUser(data.user || null)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="login-wrap">
        <div className="login-inner">
          <p className="login-checking">로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <div className="login-inner">
        <div className="login-header">
          <button type="button" className="login-lang" aria-label="언어 선택">
            <span>한국어</span>
            <span className="lang-arrow">▼</span>
          </button>
          <h1 className="login-logo">
            <Link to="/">PT체험</Link>
          </h1>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-row">
              <span className="login-input-icon">
                <IconMail />
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="이메일"
                autoComplete="email"
                className="login-input"
              />
            </div>
            <div className="login-input-row">
              <span className="login-input-icon">
                <IconLock />
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호"
                autoComplete="current-password"
                className="login-input"
              />
            </div>

            <div className="login-options">
              <div className="login-option-row">
                <span className="login-option-label">IP 보안</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ipSecurity}
                  className={`login-toggle ${ipSecurity ? 'on' : ''}`}
                  onClick={() => setIpSecurity((v) => !v)}
                >
                  <span className="login-toggle-thumb" />
                </button>
              </div>
              <label className="login-option-row login-option-keep">
                <input
                  type="checkbox"
                  checked={keepLogin}
                  onChange={(e) => setKeepLogin(e.target.checked)}
                />
                <span>로그인 상태 유지</span>
              </label>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn-submit" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-links">
            <a href="#find-password" className="login-link">비밀번호 찾기</a>
            <span className="login-link-divider" />
            <a href="#find-email" className="login-link">이메일 찾기</a>
            <span className="login-link-divider" />
            <Link to="/signup" className="login-link">회원가입</Link>
          </div>
        </div>

        <footer className="login-footer">
          <nav className="login-footer-nav">
            <a href="#terms">이용약관</a>
            <a href="#privacy">개인정보처리방침</a>
            <a href="#legal">책임의 한계와 법적고지</a>
            <a href="#help">회원정보 고객센터</a>
          </nav>
          <p className="login-footer-brand">PT체험</p>
          <p className="login-footer-copy">Copyright © PT체험. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  )
}
