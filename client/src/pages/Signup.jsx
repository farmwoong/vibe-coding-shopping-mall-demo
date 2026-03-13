import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../lib/api'

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
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
const IconLocation = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    address: '',
  })
  const [agreements, setAgreements] = useState({
    requiredTerms: false,
    optionalRealName: false,
    optionalLocation: false,
    optionalPrivacy: false,
    optionalMarketing: false,
  })

  const agreeAll =
    agreements.requiredTerms &&
    agreements.optionalRealName &&
    agreements.optionalLocation &&
    agreements.optionalPrivacy &&
    agreements.optionalMarketing

  const setAgreeAll = (checked) => {
    setAgreements({
      requiredTerms: checked,
      optionalRealName: checked,
      optionalLocation: checked,
      optionalPrivacy: checked,
      optionalMarketing: checked,
    })
  }

  const handleAgreementChange = (key, value) => {
    setAgreements((prev) => ({ ...prev, [key]: value }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // 회원가입하기 버튼 클릭 시 서버(API)로 전송 후 DB 저장
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreements.requiredTerms) {
      setError('필수 이용약관에 동의해 주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await usersApi.create({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        user_type: 'customer',
        address: form.address.trim() || undefined,
      })
      navigate('/')
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-wrap">
      <aside className="signup-aside">
        <section className="agreement-section">
          <h2 className="agreement-title">약관 동의</h2>
          <div className="agreement-box">
            <label className="agreement-row agreement-row-all">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => setAgreeAll(e.target.checked)}
              />
              <span className="agreement-label">전체 동의하기</span>
            </label>
            <p className="agreement-desc">
              실명 인증된 아이디로 가입, 위치기반서비스 이용약관(선택), 이벤트 · 혜택 정보 수신(선택) 동의를 포함합니다.
            </p>
            <label className="agreement-row">
              <input
                type="checkbox"
                checked={agreements.requiredTerms}
                onChange={(e) => handleAgreementChange('requiredTerms', e.target.checked)}
              />
              <span className="agreement-label"><em className="tag-required">필수</em> PT체험 이용약관</span>
              <a href="#terms" className="link-view">보기</a>
            </label>
            <label className="agreement-row">
              <input
                type="checkbox"
                checked={agreements.optionalRealName}
                onChange={(e) => handleAgreementChange('optionalRealName', e.target.checked)}
              />
              <span className="agreement-label"><em className="tag-optional">선택</em> 실명 인증된 아이디로 가입</span>
            </label>
            <label className="agreement-row">
              <input
                type="checkbox"
                checked={agreements.optionalLocation}
                onChange={(e) => handleAgreementChange('optionalLocation', e.target.checked)}
              />
              <span className="agreement-label"><em className="tag-optional">선택</em> 위치기반서비스 이용약관</span>
              <a href="#location" className="link-view">보기</a>
            </label>
            <label className="agreement-row">
              <input
                type="checkbox"
                checked={agreements.optionalPrivacy}
                onChange={(e) => handleAgreementChange('optionalPrivacy', e.target.checked)}
              />
              <span className="agreement-label"><em className="tag-optional">선택</em> 개인정보 수집 및 이용</span>
            </label>
            <label className="agreement-row agreement-row-indent">
              <input
                type="checkbox"
                checked={agreements.optionalMarketing}
                onChange={(e) => handleAgreementChange('optionalMarketing', e.target.checked)}
              />
              <span className="agreement-label">이벤트·혜택 정보 수신</span>
            </label>
            <div className="agreement-links">
              <a href="#privacy-guide">개인정보 수집 및 이용 안내</a>
              <a href="#children-guide">어린이용 안내</a>
            </div>
            <button type="button" className="btn-next" onClick={() => document.querySelector('.btn-submit')?.focus()}>
              다음
            </button>
            <a href="#business" className="link-business">단체, 비즈니스 회원 가입</a>
          </div>
        </section>
      </aside>

      <div className="signup-main">
        <div className="signup-card">
          <div className="signup-header">
            <h1 className="signup-logo">PT체험</h1>
            <p className="signup-sub">회원정보를 입력해 주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <span className="form-icon">
              <IconMail />
            </span>
            <label className="form-label">이메일 <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              autoComplete="email"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <span className="form-icon">
              <IconLock />
            </span>
            <label className="form-label">비밀번호 <span className="required">*</span></label>
            <div className="input-with-toggle">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                required
                autoComplete="new-password"
                className="form-input"
              />
              <button
                type="button"
                className="btn-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <IconEye />
              </button>
            </div>
          </div>

          <div className="form-row">
            <span className="form-icon">
              <IconUser />
            </span>
            <label className="form-label">이름 <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              required
              autoComplete="name"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <span className="form-icon">
              <IconLocation />
            </span>
            <label className="form-label">[선택] 주소</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="주소를 입력하세요 (선택)"
              autoComplete="street-address"
              className="form-input"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>
        </div>

        <footer className="signup-footer">
          <button type="button" className="footer-lang">
            <span className="icon-globe">🌐</span> 한국어
          </button>
        </footer>
      </div>
    </div>
  )
}
