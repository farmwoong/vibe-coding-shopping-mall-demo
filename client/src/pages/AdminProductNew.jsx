import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { productsApi } from '../lib/api'

const CATEGORIES = ['헬스장', '크로스핏', '클라이밍', '주짓수', '레슬링', '복싱']

function getCloudinaryConfig() {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim()
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim()
  const isConfigured =
    cloudName.length > 0 &&
    uploadPreset.length > 0 &&
    cloudName !== 'your_cloud_name' &&
    uploadPreset !== 'your_unsigned_preset'
  return { cloudName, uploadPreset, isConfigured }
}

export default function AdminProductNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    image: '',
    description: '',
    address: '',
  })

  if (user && user.user_type !== 'admin') {
    navigate('/', { replace: true })
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const openCloudinaryWidget = () => {
    const { cloudName, uploadPreset, isConfigured } = getCloudinaryConfig()
    console.log('Cloudinary config:', { cloudName, uploadPreset, isConfigured })
    if (!isConfigured) {
      setError(
        'Cloudinary 환경 변수가 설정되지 않았습니다. client/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 넣고 개발 서버를 재시작하세요.'
      )
      return
    }
    if (typeof window.cloudinary === 'undefined') {
      setError('Cloudinary 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    setError('')
    widgetRef.current = null
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        resourceType: 'image',
        cropping: true,
        croppingAspectRatio: 4 / 3,
        multiple: false,
      },
      (err, result) => {
        if (err) {
          console.error('Cloudinary widget error:', err)
          const msg = err?.status === 'Unknown API key' || err?.statusText === 'Unknown API key'
            ? 'Cloudinary 인증 실패: Upload preset을 Unsigned로 설정했는지, Preset 이름·Cloud name이 .env와 일치하는지 확인하세요. client/CLOUDINARY_SETUP.md 참고.'
            : err?.statusText || err?.message || '업로드 중 오류가 발생했습니다.'
          setError(msg)
          return
        }
        if (result?.event === 'success' && result?.info?.secure_url) {
          setForm((prev) => ({ ...prev, image: result.info.secure_url }))
        } else if (result?.event === 'failure' || result?.error) {
          console.error('Cloudinary upload result:', result)
          setError('업로드에 실패했습니다. client/CLOUDINARY_SETUP.md 에서 설정을 확인하세요.')
        }
      }
    )
    widgetRef.current.open()
  }

  const cloudinaryConfigured = getCloudinaryConfig().isConfigured

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sku.trim() || !form.name.trim() || !form.price || !form.category) {
      setError('SKU, 체육관명, 일일권 가격, 카테고리는 필수입니다.')
      return
    }
    const priceNum = Number(form.price)
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('일일권 가격을 올바르게 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await productsApi.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        price: priceNum,
        category: form.category,
        image: form.image.trim() || undefined,
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
      })
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || '체육관 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page admin-product-new">
      <div className="admin-header">
        <h1>새 체육관 등록</h1>
        <p className="admin-desc">체육관 정보를 입력한 뒤 등록해 주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-product-form">
        <div className="admin-form-card">
          <h2 className="admin-form-card-title">체육관 이미지</h2>
          <div className="admin-form-image-row">
            <div className="admin-form-field admin-form-image-actions">
              <button
                type="button"
                onClick={openCloudinaryWidget}
                className="admin-btn-upload"
                disabled={!cloudinaryConfigured}
                title={!cloudinaryConfigured ? 'client/.env에 Cloudinary 환경 변수를 설정하세요' : ''}
              >
                Cloudinary로 이미지 업로드
              </button>
              {!cloudinaryConfigured && (
                <span className="admin-form-field-warn">
                  client/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET 설정 후 서버 재시작
                </span>
              )}
              <span className="admin-form-field-hint">또는 URL 직접 입력</span>
              <input
                id="image"
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://..."
                className="admin-form-input"
              />
            </div>
            {form.image ? (
              <div className="admin-form-preview">
                <img src={form.image} alt="미리보기" onError={(e) => { e.target.style.display = 'none' }} />
                <button
                  type="button"
                  className="admin-form-preview-remove"
                  onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                  aria-label="이미지 제거"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="admin-form-preview admin-form-preview-placeholder">
                <span>업로드 후 미리보기가 표시됩니다</span>
              </div>
            )}
          </div>
        </div>

        <div className="admin-form-card">
          <h2 className="admin-form-card-title">체육관 정보</h2>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="sku">체육관 ID (SKU) <span className="required">*</span></label>
              <input
                id="sku"
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="예: SKU-001"
                required
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="name">체육관 이름 <span className="required">*</span></label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="체육관명 입력"
                required
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="price">일일권 가격 <span className="required">*</span></label>
              <input
                id="price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1"
                required
                className="admin-form-input"
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="category">카테고리 <span className="required">*</span></label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="admin-form-input"
              >
                <option value="">선택</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-form-field admin-form-field-full">
            <label htmlFor="address">주소 (선택)</label>
            <input
              id="address"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="체육관 주소 입력"
              className="admin-form-input"
            />
          </div>
          <div className="admin-form-field admin-form-field-full">
            <label htmlFor="description">설명 (선택)</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="체육관 설명"
              rows={4}
              className="admin-form-input admin-form-textarea"
            />
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? '등록 중...' : '체육관 등록'}
          </button>
          <Link to="/admin" className="admin-btn-secondary">취소</Link>
        </div>
      </form>
    </div>
  )
}
