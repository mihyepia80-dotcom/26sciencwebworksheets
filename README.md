# 사고도구 톡톡

초등 사고 전략 기법 활동지 웹 플랫폼 (Next.js + Firebase)

## 환경 변수

**모든 환경 변수는 Vercel Dashboard → Settings → Environment Variables 에만 입력합니다.**  
`.env` / `.env.local` 파일은 사용하지 않습니다.

필요한 변수 목록은 `.env.example`을 참고하세요.

로컬 개발 시 Vercel에 연결된 환경 변수를 사용:

```bash
npm install
npx vercel dev
```

## Firebase 설정

1. **Authentication**
   - 이메일/비밀번호 (학생 계정 자동 생성)
   - Google (교사 로그인)

## Firestore 규칙·인덱스 배포

### 방법 A — 서비스 계정 (권장, 로그인 불필요)

1. [Firebase Console → 서비스 계정](https://console.firebase.google.com/project/scienceworksheets-3ae8e/settings/serviceaccounts/adminsdk)
2. **새 비공개 키 생성** → JSON 다운로드
3. 파일명을 `firebase-service-account.json`으로 바꿔 프로젝트 루트에 저장 (로컬 CLI 전용, git 커밋 금지)
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
| 학생 | 학년·반·번호·이름 + 교사 6자리 암호 | 활동지 작성·저장, `/my`에서 기록 조회 |
| 교사 | Google + 6자리 암호 | `/teacher`에서 전체 제출 조회 |

## 배포 (Vercel)

학생 로그인 API(`/api/auth/student-login`)는 **Next.js 서버**에서만 동작합니다. Firebase Hosting(`*.web.app`) 주소로는 API가 HTML만 반환하므로 사용하지 마세요.

### 필수 Vercel 환경 변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 설정 (6개) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON **한 줄** (`private_key`의 `\n`은 그대로 두거나 base64 인코딩 가능) |
| `STUDENT_AUTH_SECRET` | 학생 Auth 내부 비밀번호용 임의 문자열 |
| `GEMINI_API_KEY` | AI 기능 사용 시 |

서비스 계정 JSON을 Vercel에 넣을 값으로 출력 (로컬 `firebase-service-account.json` 필요):

```bash
npm run print:service-account-env
```

### Deployment Protection

Vercel **Settings → Deployment Protection**에서 Production 보호(Vercel Authentication)를 **끄세요**.  
켜져 있으면 학생 `fetch("/api/auth/student-login")`가 HTML 로그인 페이지를 받아 로그인에 실패합니다.

### 접속 URL

- 사용: `https://<프로젝트>.vercel.app` (또는 연결한 커스텀 도메인)
- 사용 금지: `https://scienceworksheets-3ae8e.web.app` (Hosting 전용, API 없음)
