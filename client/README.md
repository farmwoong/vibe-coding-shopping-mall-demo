# 강한하루 클라이언트

React + Vite 기반 프론트엔드입니다. 백엔드 API(Express)와 연동됩니다.

## 요구 사항

- Node.js 18+

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| VITE_API_URL | 백엔드 API 주소 | (비어 있으면 개발 시 프록시 사용) |

개발 시 `vite.config.js`에서 `/api`를 `http://localhost:5000`으로 프록시하므로, 백엔드를 5000 포트에서 실행하면 별도 설정 없이 연동됩니다.

## 폴더 구조

```
src/
├── components/   # 공통 컴포넌트 (Layout 등)
├── pages/         # 페이지 컴포넌트 (Home, Products)
├── lib/           # API 클라이언트, 유틸
├── assets/        # 정적 이미지 등
├── App.jsx
├── main.jsx
└── index.css
```

## 스크립트

- `npm run dev` — Vite 개발 서버 (HMR)
- `npm run build` — `dist/` 프로덕션 빌드
- `npm run preview` — 빌드 결과 로컬 서빙
- `npm run lint` — ESLint 실행
