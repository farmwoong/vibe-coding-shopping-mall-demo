import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)
const IconCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const [openDropdown, setOpenDropdown] = useState(false)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!openDropdown) return
    const handleClickOutside = (e) => {
      const btn = buttonRef.current
      const dd = dropdownRef.current
      if (btn?.contains(e.target) || dd?.contains(e.target)) return
      setOpenDropdown(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  const handleLogout = () => {
    logout()
    setOpenDropdown(false)
  }

  const [dropdownStyle, setDropdownStyle] = useState({})

  useEffect(() => {
    if (!openDropdown || !buttonRef.current) return
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
          zIndex: 9999,
        })
      }
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openDropdown])

  return (
    <div className="site-wrap">
      <div className="announcement-bar">
        <span className="announcement-full">[NEW] 2026 PT체험 시즌 컬렉션</span>
        <span className="announcement-short">[NEW] 2026 PT체험</span>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            PT체험
          </Link>
          <nav className="header-nav">
            <Link to="/products?category=fitness">Fitness</Link>
            <Link to="/products?category=wrestling">Wrestling</Link>
            <Link to="/products?category=climbing">Climbing</Link>
          </nav>
          <div className="header-actions">
            <button type="button" className="header-icon-btn" aria-label="검색">
              <IconSearch />
            </button>
            <Link to="/cart" className="header-icon-btn header-cart-wrap" aria-label="장바구니">
              <IconCart />
              {user && cartCount > 0 && (
                <span className="header-cart-badge" aria-hidden="true">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {user?.user_type === 'admin' && (
              <Link to="/admin" className="header-admin-btn">Admin</Link>
            )}
            {!user ? (
              <Link to="/login" className="header-login-btn">로그인</Link>
            ) : (
              <div className="header-user-wrap" ref={buttonRef}>
                <button
                  type="button"
                  className="header-user-btn"
                  onClick={() => setOpenDropdown((v) => !v)}
                  aria-expanded={openDropdown}
                  aria-haspopup="true"
                >
                  <span className="header-user-text-full">{user.name}님 환영합니다</span>
                  <span className="header-user-text-short">{user.name}님</span>
                </button>
                {openDropdown &&
                  createPortal(
                    <div
                      ref={dropdownRef}
                      className="header-user-dropdown header-user-dropdown--portal"
                      style={dropdownStyle}
                    >
                      <Link
                        to="/orders/status"
                        className="header-user-dropdown-item"
                        onClick={() => setOpenDropdown(false)}
                      >
                        수업 예약 현황
                      </Link>
                      <button type="button" className="header-user-dropdown-item" onClick={handleLogout}>
                        로그아웃
                      </button>
                    </div>,
                    document.body
                  )}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  )
}
