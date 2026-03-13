# Shopping Mall Server

Node.js + Express + MongoDB API 서버입니다.

## 요구 사항

- Node.js 18+
- MongoDB (로컬 또는 Atlas)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.example을 복사 후 .env 생성)
# Windows: copy .env.example .env
# Mac/Linux: cp .env.example .env

# 개발 모드 (파일 변경 시 자동 재시작)
npm run dev

# 프로덕션 실행
npm start
```

## 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| PORT | 서버 포트 | 5000 |
| MONGODB_ATLAS_URL | MongoDB Atlas 연결 문자열 (우선 사용) | mongodb+srv://user:pass@cluster.xxx.mongodb.net/shopping-mall |
| MONGODB_URI | MongoDB 연결 문자열 (MONGODB_ATLAS_URL 없을 때 사용) | mongodb://localhost:27017/shopping-mall |

우선순위: MONGODB_ATLAS_URL → MONGODB_URI → mongodb://localhost:27017/shopping-mall

## API

- `GET /` - 상태 확인
