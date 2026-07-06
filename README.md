# 사고도구 톡톡 (Sagodogu Toktok)

**웹 기반 초등 과학 탐구·사고기법 학습지 플랫폼**

Harvard Project Zero **Visible Thinking** 루틴 44종과 초등 과학 **개념기반 탐구** 수업 설계를 디지털로 제공합니다. 교사의 수업 설계·모둠 운영·학생 글쓰기·성찰·제출을 하나의 웹 플랫폼에서 지원합니다.

| 항목 | 내용 |
|------|------|
| **배포 URL** | [https://sagodogu-toktok.vercel.app](https://sagodogu-toktok.vercel.app) |
| **기술 스택** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Firebase, Google Gemini, Padlet API |
| **배포** | Vercel (Production) |
| **상세 PRD** | [docs/PRD.md](docs/PRD.md) (v2.0, 2026-07) |

---

## 목차

- [주요 기능](#주요-기능)
- [사용자 역할](#사용자-역할)
- [빠른 시작](#빠른-시작)
- [환경 변수](#환경-변수)
- [Firebase 설정](#firebase-설정)
- [배포 (Vercel)](#배포-vercel)
- [화면 구조](#화면-구조)
- [시스템 아키텍처](#시스템-아키텍처)
- [API 라우트](#api-라우트)
- [교육 콘텐츠](#교육-콘텐츠)
- [기능 상세](#기능-상세)
- [개발 스크립트](#개발-스크립트)

---

## 주요 기능

| ID | 기능 | 상태 | 사용자 |
|----|------|------|--------|
| F-01 | 학생 로그인 (서버 API + 6자리 암호) | ✅ | 학생 |
| F-01b | 교사 Google + 6자리 암호 | ✅ | 교사 |
| F-02 | 템플릿 목록·상세 (44종) | ✅ | 전체 |
| F-03 | 학습지 작성·임시저장·제출 | ✅ | 학생 |
| F-04 | 입력 검증·예시 문구 방지 | ✅ | 학생 |
| F-05 | 공통 마무리(한 줄 결론·셀프 체크) | ✅ | 학생 |
| F-06 | PDF 인쇄 | ✅ | 학생·교사 |
| F-07 | AI 제출 피드백 (Gemini) | ✅ | 학생 |
| F-08 | 교사 대시보드 (제출 조회·삭제) | ✅ | 교사 |
| F-09 | 수업지도안 CRUD + AI 생성 | ✅ | 교사 |
| F-10 | 유도 질문 (교사 고정 → 학생 노출) | ✅ | 교사·학생 |
| F-11 | 탐구보고서 | ✅ | 학생 |
| F-12 | 동료 피드백 | ✅ | 학생 |
| F-13 | 공유 링크·초대 링크 | ✅ | 학생·교사 |
| F-14 | 마이페이지 | ✅ | 학생 |
| F-15 | 학습지 사용 현황 | ✅ | 학생 |
| F-16 | 클립보드 복사·붙여넣기 차단 | ✅ | 학생 |
| F-17 | 수업 설계 3단계 (①~③) | ✅ | 교사 |
| F-18 | 학습지 텍스트 배포 | ✅ | 교사 |
| F-19 | 모둠 활동 관리 | ✅ | 교사 |
| F-20 | 칭찬 배지 | ✅ | 교사 |
| F-21 | 통합 작업공간 (`/workspace`) | ✅ | 학생 |
| F-22 | Padlet 생성 (샌드박스·게시판) | ✅ | 교사 |
| F-23 | 법적 고지 (개인정보·약관·AI 윤리) | ✅ | 전체 |

---

## 사용자 역할

| 역할 | 인증 | 주요 권한 |
|------|------|-----------|
| **학생** | 학년·반·번호·이름 + **교사 6자리 암호** | 활동지·탐구보고서 작성·제출, `/my`, 동료 피드백, AI 피드백 1일 1회 |
| **교사** | **Google OAuth** + **6자리 암호** | `/teacher/*` 전체, 제출 조회·삭제, 수업 설계, 모둠·배지·Padlet |
| **비로그인** | 없음 | 홈·템플릿 체험(제한), `/share/[token]`, `/join/[token]`, 법적 고지 |

### 학생 로그인

- **API**: `POST /api/auth/student-login`
- **입력**: 학년, 반, 번호, 이름, 6자리 `accessPin`
- **처리**: Firebase Admin SDK custom token 발급 → `students/{uid}` 저장
- **암호**: Firestore `studentAccessPins/{pin}` → `teacherUid` (교사별 고유 6자리)

### 교사 로그인

- Google OAuth (팝업 우선, 실패 시 redirect) → 6자리 PIN 설정/입력
- `/login`에서 **서비스 이용 동의** 후 로그인 활성화

---

## 빠른 시작

**모든 환경 변수는 Vercel Dashboard → Settings → Environment Variables 에만 입력합니다.**  
`.env` / `.env.local` 파일은 사용하지 않습니다.

필요한 변수 목록은 [`.env.example`](.env.example)을 참고하세요.

```bash
npm install
npx vercel dev   # Vercel 연결 환경 변수 사용 (권장)
# 또는
npm run dev      # 로컬 Next.js (Firebase env 수동 설정 필요)
```

---

## 환경 변수

### 필수 (Vercel)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 설정 (6개) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON **한 줄** (`private_key`의 `\n`은 그대로 두거나 base64 인코딩 가능) |
| `STUDENT_AUTH_SECRET` | 학생 Auth 내부 비밀번호용 임의 문자열 |
| `GEMINI_API_KEY` | AI 기능 (제출 피드백·지도안·유도질문 등) |

### 선택

| 변수 | 설명 |
|------|------|
| `GEMINI_DAILY_LIMIT` | AI 일일 전체 한도 (기본 100) |
| `PADLET_API_KEY` | Padlet API (서버 전용, 교사 Padlet 생성) |
| `PADLET_DEFAULT_WORKSPACE_ID` | Padlet 워크스페이스 ID |
| `PADLET_DEFAULT_ROLE` | Padlet AI 역할 (기본: 초등 과학 교사) |

서비스 계정 JSON을 Vercel env 값으로 출력 (로컬 `firebase-service-account.json` 필요):

```bash
npm run print:service-account-env
```

---

## Firebase 설정

### Authentication

- **이메일/비밀번호** — 학생 계정 자동 생성 (서버 API)
- **Google** — 교사 로그인

### Firestore 규칙·인덱스 배포

#### 방법 A — 서비스 계정 (권장, 로그인 불필요)

1. [Firebase Console → 서비스 계정](https://console.firebase.google.com/project/scienceworksheets-3ae8e/settings/serviceaccounts/adminsdk)
2. **새 비공개 키 생성** → JSON 다운로드
3. 파일명을 `firebase-service-account.json`으로 바꿔 프로젝트 루트에 저장 (로컬 CLI 전용, **git 커밋 금지**)
4. 실행:

```bash
npm run deploy:firestore
```

#### 방법 B — Google 로그인

```bash
npm run firebase:login
npx firebase-tools deploy --only firestore --project scienceworksheets-3ae8e
```

### 기타

- **교사 등록** — Google 로그인 후 Firestore `teachers/{교사 UID}` 문서 생성
- **Authorized domains** — Vercel 배포 URL을 Firebase Auth에 추가

---

## 배포 (Vercel)

학생 로그인 API(`/api/auth/student-login`)는 **Next.js 서버**에서만 동작합니다.  
Firebase Hosting(`*.web.app`) 주소로는 API가 HTML만 반환하므로 **사용하지 마세요**.

### Deployment Protection

Vercel **Settings → Deployment Protection**에서 Production 보호(Vercel Authentication)를 **끄세요**.  
켜져 있으면 학생 `fetch("/api/auth/student-login")`가 HTML 로그인 페이지를 받아 로그인에 실패합니다.

### 접속 URL

| URL | 용도 |
|-----|------|
| `https://sagodogu-toktok.vercel.app` | ✅ 사용 (또는 연결한 커스텀 도메인) |
| `https://scienceworksheets-3ae8e.web.app` | ❌ 사용 금지 (Hosting 전용, API 없음) |

---

## 화면 구조

| 경로 | 설명 | 역할 |
|------|------|------|
| `/` | 홈 — 템플릿 그리드(7범주), 탐구보고서入口 | 전체 |
| `/login` | 학생·교사 로그인, 이용 동의 | 전체 |
| `/templates/[id]` | 학습지 작성 | 학생·게스트 |
| `/my` | 내 제출·배지·기록 | 학생 |
| `/workspace` | 통합 작업공간 (활동지 + 탐구보고서) | 학생 |
| `/inquiry-report` | 탐구보고서 편집 | 학생 |
| `/share/[token]` | 공유 읽기 전용 | 전체 |
| `/join/[token]` | 교사 초대 딥링크 | 학생 |
| `/teacher` | 교사 대시보드 | 교사 |
| `/teacher/thinking-worksheets` | ① 사고 활동지 설계 | 교사 |
| `/teacher/lesson-plans` | ② 수업지도안 | 교사 |
| `/teacher/worksheet-content` | ③ 학습지 텍스트 배포 | 교사 |
| `/teacher/guided-questions` | 유도 질문 | 교사 |
| `/teacher/groups` | 모둠 활동 (명렬·편성·역할·칭찬) | 교사 |
| `/teacher/badges` | 칭찬 배지 | 교사 |
| `/teacher/padlet` | Padlet 생성 | 교사 |
| `/privacy`, `/terms`, `/ai-ethics` | 법적·윤리 고지 | 전체 |

---

## 시스템 아키텍처

```
[Browser — React 19 Client]
   ├── Next.js 15 App Router (페이지 SSG/CSR + /api/* Route Handlers)
   ├── Firebase Client (Auth, Firestore)
   └── public/*.html (Standalone 4종)

[Server — Vercel]
   ├── Firebase Admin SDK (학생 로그인, AI 쿼터)
   ├── Google Gemini API
   └── Padlet API (교사 전용)
```

### Firestore 주요 컬렉션

| 컬렉션 | 용도 |
|--------|------|
| `students/{uid}` | 학생 프로필 |
| `teachers/{uid}` | 교사 프로필·accessPin |
| `studentAccessPins/{pin}` | 6자리 → teacherUid |
| `submissions/{id}` | 학습지 (draft / submitted) |
| `inquiryReports/{id}` | 탐구보고서 |
| `lessonPlans/{id}` | 지도안 |
| `guidedQuestionSets/{id}` | 유도 질문 |
| `worksheetContent/{templateId}` | 배포 텍스트 |
| `badgeDefinitions/{id}`, `studentBadges/{id}` | 배지 |
| `groupRoleSchedules/{id}` | 주간 모둠 역할 |
| `teachers/{uid}/*` | 명렬·편성·분리·칭찬 |

### 핵심 모듈

| 경로 | 책임 |
|------|------|
| `src/lib/templates/registry.ts` | 44종 템플릿 |
| `src/lib/curriculum/design-flow.ts` | 3단계 수업 설계 URL·프리셋 |
| `src/lib/group-activity/` | 모둠 편성·역할 |
| `src/lib/padlet/` | Padlet 클라이언트·프리셋·서버 |
| `src/lib/firebase/teacher-auth.ts` | 교사·학생 역할 |
| `src/components/AuthGate.tsx` | 라우트 보호 |

---

## API 라우트

| 경로 | 용도 |
|------|------|
| `POST /api/auth/student-login` | 학생 custom token 발급 |
| `GET /api/auth/student-login` | Admin 연결 헬스체크 |
| `POST /api/feedback` | AI 제출 피드백 (Gemini) |
| `GET /api/ai-status` | AI 쿼터 조회 |
| `POST /api/guided-questions` | 유도 질문 AI (교사) |
| `POST /api/lesson-plans/generate` | 지도안 AI (교사) |
| `POST /api/worksheet-content` | 학습지 텍스트 AI (교사) |
| `GET /api/padlet/status` | Padlet API 키 설정 여부 |
| `POST /api/padlet/boards` | Padlet 보드 생성 |
| `GET /api/padlet/boards/status/[statusKey]` | Padlet AI 생성 진행 상태 |
| `GET /api/padlet/boards/[boardId]` | Padlet 보드 조회 |
| `POST /api/padlet/boards/[boardId]/posts` | Padlet 게시글 추가 |

---

## 교육 콘텐츠

### 탐구 범주 (7종)

개념 소개 및 탐색 · 개념 형성 · 개념 종합 및 정리 · 개념 심화 · 피드백 지원 · 자기성찰 · 학생교류

### 사고도구 템플릿 (44종)

- **레지스트리**: `src/lib/templates/registry.ts`
- **경로**: `/templates/[id]` (SSG)
- **공통 헤더**: 단원 → 주제 → 글쓰기 상황 (`unit`, `topic`, `writingContext`)

대표: See-Think-Wonder, Think-Puzzle-Explore, Claim-Support-Question, Color-Symbol-Image, Headline, G-S-C-E 등

### Standalone HTML (4종)

| 파일 | 루틴 |
|------|------|
| `public/gsce-worksheet.html` | G-S-C-E |
| `public/csq-solution-concentration.html` | CSQ |
| `public/headlines-daily-solutions.html` | Headlines |
| `public/csi-solution-daily.html` | CSI |

---

## 기능 상세

### 수업 설계 3단계 (교사)

| 단계 | 경로 | 기능 |
|------|------|------|
| ① 사고 활동지 | `/teacher/thinking-worksheets` | 단원·차시·학습 주제, 사고도구 선택 |
| ② 수업지도안 | `/teacher/lesson-plans` | ① 연동, 사고도구·지도안 작성 (AI 보조) |
| ③ 학습지 텍스트 | `/teacher/worksheet-content` | 안내 문구 편집·**학생 배포** |

URL 파라미터 `unitId`, `period`, `learningTopic`, `templateId`로 단계 간 컨텍스트 유지.

### 학습지 작성 (학생)

1. **WorksheetHeader** — 단원·주제·글쓰기 상황
2. **GuidedQuestionsPanel** — 교사 고정 유도 질문 (학생 AI 생성 UI 없음)
3. **TemplateRenderer** — 루틴별 React 컴포넌트
4. **WorksheetClosingSection** — 한 줄 결론 + 셀프 체크 3항
5. **PeerFeedbackSection** — 조건부 동료 피드백

**입력 검증**: 일반 항목 40자+, 한글 1자+, 예시 문구 거부, 클립보드 차단

### AI 피드백

- 학생: 제출 후 Gemini 피드백 (1인 1일 1회, 전체 `GEMINI_DAILY_LIMIT`)
- 교사 전용 AI: 유도 질문·지도안·학습지 텍스트 생성 (학생 UI 미노출)

### 모둠 활동 (`/teacher/groups`)

명렬표(Excel 가져오기) · 분리 조건 · 6모둠 자동 편성 · 주간 역할표 · 모둠 칭찬

### Padlet (`/teacher/padlet`)

- **샌드박스**: Wall / Stream / Grid / Map / Canvas / Shelf (6종, 파스텔 톤)
- **게시판**: 컬럼형 — **1~6모둠** 또는 **1~25번**, 컬럼별 안내 카드 자동 생성
- **맞춤**: 교사 직접 AI 지시문 입력

### 기타

- **탐구보고서**: `/inquiry-report` — 5단계 탐구 과정, 시각화 캔버스
- **칭찬 배지**: 5색 상의 아이콘, 교사 수여·회수, `/my`에서 조회
- **통합 작업공간**: `/workspace` — 활동지 + 탐구보고서 2분할 편집
- **초대 링크**: 교사가 활동지·보고서·workspace 링크 생성 → `/join/[token]`

---

## 개발 스크립트

```bash
npm run dev              # Next.js 개발 서버
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run lint             # ESLint
npm run deploy:firestore # Firestore 규칙·인덱스 배포
npm run firebase:login   # Firebase CLI 로그인
```

---

## 설계 원칙

1. **교육 우선** — UI·검증은 수업 목표(용어, 근거, 인과)에 맞춤
2. **단일 소스** — 템플릿·커리큘럼·필드 키를 코드 레지스트리에서 관리
3. **학생 주도성** — 임시 저장, 재편집, `/my` 기록 조회
4. **교사 통제** — Google + 6자리 PIN, 전체 제출·설계·모둠 관리
5. **최소 침습 AI** — 학생 화면 AI 질문 생성 숨김, 제출 후 피드백만
6. **서버 비밀 관리** — API 키·Admin SDK는 Vercel 환경 변수만 사용

---

## 상세 문서

전체 제품 요구사항·데이터 모델·사용자 시나리오·Backlog는 **[docs/PRD.md](docs/PRD.md)** (v2.0)를 참고하세요.

> 본 연구에서 개발한 「사고도구 톡톡」(v2.0, 2026)은 Project Zero Visible Thinking 44종을 웹 학습지로 구현하고, 교사 3단계 수업 설계·6자리 교실 암호 기반 학생 인증·모둠 편성·Padlet 컬럼형 협업 게시판·Gemini 보조 피드백을 통합한 초등 과학 디지털 학습 환경이다.

---

*본 README는 sagodogu-toktok 저장소 **main 브랜치 (2026-07)** 구현 상태를 기준으로 작성되었다.*
