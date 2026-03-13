# Cloudinary 업로드 위젯 "Unknown API key" / 401 해결

## 원인

- **401 Unauthorized** / **Unknown API key** 는 Cloudinary가 업로드 요청을 인증 실패로 거부할 때 발생합니다.
- 우리 앱은 **Unsigned** 업로드만 사용하므로, **API key/secret을 넣지 않습니다.**  
  이 모드에서는 **Cloud name** + **Upload preset(Unsigned)** 만 맞으면 됩니다.
- 아래가 맞지 않으면 같은 에러가 납니다.

  | 가능한 원인 | 설명 |
  |------------|------|
  | Preset이 Signed로 되어 있음 | Unsigned가 아니면 Cloudinary가 API key를 기대해 401 발생 |
  | Preset 이름 불일치 | `.env`의 preset 이름이 대시보드와 다름 (대소문자, 띄어쓰기 포함) |
  | Cloud name 불일치 | `.env`의 cloud name이 해당 계정의 Cloud name과 다름 |
  | Preset 미생성 | 해당 cloud에 그 이름의 preset이 없음 |

---

## 해결을 위해 취해야 할 행동 (순서대로)

### 1. Cloudinary 로그인 및 Cloud name 확인

1. [https://cloudinary.com/console](https://cloudinary.com/console) 로그인
2. 대시보드 **상단** 또는 **Account Details** 에서 **Cloud name** 확인 (예: `small_gym`)
3. `client/.env`의 `VITE_CLOUDINARY_CLOUD_NAME` 값을 **그대로** 입력 (따옴표 없이)

```env
VITE_CLOUDINARY_CLOUD_NAME=small_gym
```

### 2. Unsigned Upload Preset 만들기/수정

1. **Settings** (톱니바퀴) → **Upload** 탭
2. **Upload presets** 섹션에서 **Add upload preset** 클릭 (또는 기존 preset 선택 후 수정)
3. 다음을 **반드시** 맞춤:
   - **Preset name**: 사용할 이름 입력 (예: `gym_unsigned`)  
     → 이 이름을 `.env`의 `VITE_CLOUDINARY_UPLOAD_PRESET`에 **완전 동일**하게 넣기
   - **Signing Mode**: **Unsigned** 선택
   - **Resource type**: 이미지 업로드만 할 경우 **Image** 권장
4. **Save** 클릭

### 3. .env에 Preset 이름 넣기

`client/.env`:

```env
VITE_CLOUDINARY_UPLOAD_PRESET=gym_unsigned
```

(위에서 만든 Preset name과 **완전히 동일**하게, 따옴표 없이)

### 4. 개발 서버 재시작 및 브라우저 새로고침

1. 터미널에서 Vite 개발 서버 **종료** (Ctrl+C) 후 다시 실행: `npm run dev`
2. 브라우저에서 **강력 새로고침** (Ctrl+Shift+R)
3. 체육관 등록 페이지에서 **Cloudinary로 이미지 업로드** 다시 시도

### 5. 그래도 401이면

- **다른 Cloudinary 계정**을 쓰는 경우, 그 계정의 Cloud name과 Preset을 사용 중인지 확인
- Preset을 **삭제 후 새로** 만들고, 이름을 단순하게 (예: `unsigned_upload`) 로 해서 다시 시도
- [Cloudinary 지원](https://support.cloudinary.com/)에 "Unsigned upload preset 사용 중 401 Unknown API key" 로 문의

---

## 요약 체크리스트

- [ ] Cloud name이 대시보드와 `.env`에 동일하게 들어가 있는가?
- [ ] Upload preset의 **Signing Mode**가 **Unsigned**인가?
- [ ] Preset name이 `.env`의 `VITE_CLOUDINARY_UPLOAD_PRESET`과 **완전 일치**하는가?
- [ ] Preset 저장 후 **Vite 재시작**과 **브라우저 새로고침**을 했는가?
