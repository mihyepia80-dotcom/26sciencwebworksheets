# 사고도구 톡톡

초등 사고 전략 기법 활동지 웹 플랫폼 (Next.js + Firebase)

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # Firebase 값 입력
npm run dev
```

## Firebase 설정

1. **Authentication**
   - 이메일/비밀번호 (학생 계정 자동 생성)
   - Google (교사 로그인)
## Firestore 규칙·인덱스 배포

### 방법 A — 서비스 계정 (권장, 로그인 불필요)

1. [Firebase Console → 서비스 계정](https://console.firebase.google.com/project/scienceworksheets-3ae8e/settings/serviceaccounts/adminsdk)
2. **새 비공개 키 생성** → JSON 다운로드
3. 파일명을 `firebase-service-account.json`으로 바꿔 프로젝트 루트에 저장  
   (계정: `firebase-adminsdk-fbsvc@scienceworksheets-3ae8e.iam.gserviceaccount.com`)
4. 실행:

```bash
npm run deploy:firestore
```

### 방법 B — Google 로그인

```bash
npm run firebase:login
npx firebase-tools deploy --only firestore --project scienceworksheets-3ae8e
```
3. **교사 등록** — Firestore `teachers/{교사 UID}` 문서 생성 (Google 로그인 후 UID 확인)
4. **Authorized domains** — Vercel 배포 URL 추가

## 학생 / 교사

| 역할 | 로그인 | 기능 |
|------|--------|------|
| 학생 | 학년·반·번호·이름 + 암호 `2600` | 활동지 작성·저장, `/my`에서 기록 조회 |
| 교사 | Google | `/teacher`에서 전체 제출 조회 |

## 배포 (Vercel)

환경 변수에 `.env.example` 항목을 모두 설정하세요.
