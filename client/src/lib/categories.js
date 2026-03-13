/** 상품 DB에 저장되는 카테고리 값 (AdminProductNew/Edit에서 사용) */
export const PRODUCT_CATEGORIES = ['헬스장', '크로스핏', '클라이밍', '주짓수', '레슬링', '복싱']

/** Navbar/Products용: id=URL param, label=표시명, value=API 전달값 (빈값이면 전체) */
export const CATEGORY_NAV = [
  { id: 'all', label: 'ALL', value: '' },
  { id: 'fitness', label: 'Fitness', value: 'fitness' },
  { id: 'wrestling', label: 'Wrestling', value: 'wrestling' },
  { id: 'climbing', label: 'Climbing', value: 'climbing' },
  { id: 'crossfit', label: 'Crossfit', value: 'crossfit' },
]
