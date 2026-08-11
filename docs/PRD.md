# 제품 요구사항 명세서 (PRD)

## 사고도구 톡톡 (Sagodogu Toktok)

**웹 기반 초등 과학 탐구·사고기법 학습지 플랫폼**

| 항목 | 내용 |
|------|------|
| 문서 버전 | **2.0** |
| 작성·개정일 | 2026년 6월 (v1.0) → **2026년 7월 (v2.0)** |
| 대상 독자 | 석사학위논문 연구·개발 절, 교육 현장 파일럿 운영자, 개발·운영 담당자 |
| 기술 스택 | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Firebase, Google Gemini, Padlet API |
| 배포 | Vercel (`https://sagodogu-toktok.vercel.app`) |
| 저장소 | sagodogu-toktok |

---

## 1. 문서 목적

본 문서는 **사고도구 톡톡** 웹 애플리케이션의 **현재까지 구현된** 제품 요구사항·기능·데이터·운영 정책을 기술한다. Harvard Project Zero의 **Visible Thinking** 루틴과 초등 과학 **개념기반 탐구** 수업 설계를 디지털 환경에 구현하며, v2.0에서는 **교사 수업 설계 3단계**, **모둠 활동 관리**, **칭찬 배지**, **Padlet API 연동**, **서버 기반 학생 로그인** 등 v1.0 이후 추가·변경된 기능을 반영한다.

---

## 2. 배경 및 문제 정의

### 2.1 교육적 배경

초등 과학 수업에서 학생의 **과학적 사고력**과 **과학 글쓰기**를 동시에 기르기 위해서는 탐구 활동 이후 **구조화된 성찰·정리·표현** 단계가 필수적이다. Project Zero의 Visible Thinking 루틴(예: See-Think-Wonder, Claim-Support-Question, Color-Symbol-Image 등)은 관찰·추론·일반화·성찰을 촉진하는 검증된 사고 프레임워크이다.

### 2.2 현장 문제

1. **종이 활동지**: 차시마다 다른 양식 인쇄·배부, 회수·피드백 비효율
2. **사고도구 선택**: 40여 종 중 탐구 단계에 맞는 도구 배치 어려움
3. **과학 글쓰기 품질**: 예시 복사·짧은 감상 수준에 머무름
4. **교사 지원 부족**: 유도 질문·제출 모니터링·모둠 편성·협업 보드 운영의 분산

### 2.3 제품 비전

> **탐구 단계별 사고기법 학습지를 디지털로 제공하고, 교사의 수업 설계·모둠 운영·학생 글쓰기·성찰·제출을 하나의 웹 플랫폼에서 지원한다.**

---

## 3. 목표 및 설계 원칙

### 3.1 핵심 목표

| ID | 목표 | 구현 지표 |
|----|------|-----------|
| G1 | 탐구 단계별 사고도구 학습지 | **44종** React 템플릿, 7개 탐구 범주 |
| G2 | 과학 글쓰기 품질 | 40자·한글 검증, 예시 문구·클립보드 방지 |
| G3 | 교사 수업 설계·운영 | 3단계 설계 흐름, 지도안, 유도 질문, 모둠·배지 |
| G4 | AI 보조 | Gemini — 제출 피드백·지도안·유도질문·학습지 텍스트 (교사 전용 생성) |
| G5 | 학습 기록·공유 | Firestore, 공유 링크, PDF, 마이페이지 |
| G6 | 협업·게시판 | Padlet API — 샌드박스·컬럼형 게시판 (교사) |

### 3.2 설계 원칙

1. **교육 우선**: UI·검증은 수업 목표(용어, 근거, 인과)에 맞춤
2. **단일 소스**: 템플릿·커리큘럼·필드 키를 코드 레지스트리에서 관리
3. **학생 주도성**: 임시 저장, 재편집, `/my` 기록 조회
4. **교사 통제**: Google 교사 + 6자리 암호, 전체 제출·설계·모둠 관리
5. **반응형·인쇄**: 모바일·태블릿·데스크톱, A4 PDF
6. **최소 침습 AI**: 유도 질문 AI 생성은 교사 화면만; 학생 화면은 F-24 탐구질문 챗봇(규칙 우선·턴 제한)과 F-07 제출 후 피드백만
7. **서버 비밀 관리**: API 키·Admin SDK는 Vercel 환경 변수만 사용 (`.env` 미사용)

---

## 4. 이해관계자 및 사용자

### 4.1 사용자 역할

| 역할 | 인증 | 주요 권한 |
|------|------|-----------|
| **학생** | 학년·반·번호·이름 + **교사가 설정한 6자리 암호** | 활동지·탐구보고서 작성·제출, `/my`, 동료 피드백(조건부), AI 피드백 1일 1회 |
| **교사** | **Google OAuth** + **6자리 암호**(최초 설정·세션 확인) | `/teacher/*` 전체, 제출 조회·삭제, 수업 설계, 모둠·배지·Padlet |
| **비로그인** | 없음 | 홈·템플릿 체험(제한), `/share/[token]`, `/join/[token]`, 법적 고지 페이지 |

### 4.2 학생 로그인 (F-01, 서버 API)

- **경로**: `POST /api/auth/student-login`
- **입력**: 학년, 반, 번호, 이름, 6자리 `accessPin`
- **처리**: Firebase Admin SDK로 custom token 발급, `students/{uid}` 프로필 저장
- **이메일 형식**: `{grade}-{classNo}-{studentNo}@sagodogu-student.app`
- **암호 검증**: Firestore `studentAccessPins/{pin}` → `teacherUid` 매핑 (교사별 고유 6자리)
- **헬스체크**: `GET /api/auth/student-login` → Admin 연결 상태

### 4.3 교사 로그인 (F-01b)

- **1단계**: Google OAuth (팝업 우선, 실패 시 redirect)
- **2단계**: 6자리 숫자 암호 설정(최초) 또는 입력(재방문)
- **저장**: `teachers/{uid}.accessPin`, `studentAccessPins/{pin}` 동기화
- **세션**: `sessionStorage`에 PIN 확인 상태 (`teacher-pending` → `teacher`)
- **Firestore 규칙**: `sign_in_provider == google.com` 교사만 쓰기 허용

### 4.4 서비스 이용 동의

- `/login`에서 **ServiceConsentPanel** — 동의 완료 후 학생·교사 로그인 활성화
- 동의 내용 `localStorage` 저장

---

## 5. 교육과정·콘텐츠 체계

### 5.1 탐구 범주 (7종)

| 범주 ID | 명칭 |
|---------|------|
| `concept-exploration` | 개념 소개 및 탐색 |
| `concept-formation` | 개념 형성 |
| `concept-synthesis` | 개념 종합 및 정리 |
| `concept-deepening` | 개념 심화 |
| `feedback-support` | 피드백 지원 |
| `self-reflection` | 자기성찰 |
| `student-exchange` | 학생교류 |

### 5.2 사고도구 템플릿 (44종)

- **레지스트리**: `src/lib/templates/registry.ts`
- **경로**: `/templates/[id]` (SSG)
- **공통 헤더**(모든 템플릿): **단원** → **주제** → **글쓰기 상황** (`unit`, `topic`, `writingContext`)
- **메타**: 국·영문 명, 범주, 순번, AI 가이드, 제출 검증 필드

**대표 템플릿**

| ID | 명칭 |
|----|------|
| `see-think-wonder` | See, Think, Wonder |
| `think-puzzle-explore` | Think, Puzzle, Explore |
| `claim-support-question` | Claim, Support, Question |
| `color-symbol-image` | Color, Symbol, Image |
| `headline` | Headline |
| `gsce` | Generate-Sort-Connect-Elaborate |

### 5.3 단원·차시 프리셋 (용해와 용액 등)

- **커리큘럼**: `src/lib/curriculum/design-flow.ts`, `src/lib/lesson-plan/unit-curriculum.ts`
- **단원 ID** 예: `dissolution-solution` — 차시별 학습 주제·연동 템플릿 ID
- **교사 ①~③ 설계**와 학생 배포 텍스트에 동일 프리셋 연동

### 5.4 Standalone HTML (4종)

| 파일 | 루틴 |
|------|------|
| `public/gsce-worksheet.html` | G-S-C-E |
| `public/csq-solution-concentration.html` | CSQ |
| `public/headlines-daily-solutions.html` | Headlines |
| `public/csi-solution-daily.html` | CSI |

---

## 6. 기능 요구사항 (전체 목록)

### 6.1 기능 요약표

| ID | 기능 | 우선순위 | 상태 | 사용자 |
|----|------|----------|------|--------|
| F-01 | 학생 로그인 (서버 API + 6자리 암호) | 필수 | ✅ | 학생 |
| F-01b | 교사 Google + 6자리 암호 | 필수 | ✅ | 교사 |
| F-02 | 템플릿 목록·상세 (44종) | 필수 | ✅ | 전체 |
| F-03 | 학습지 작성·임시저장·제출 | 필수 | ✅ | 학생 |
| F-04 | 입력 검증·예시 문구 방지 | 필수 | ✅ | 학생 |
| F-05 | 공통 마무리(한 줄 결론·셀프 체크) | 필수 | ✅ | 학생 |
| F-06 | PDF 인쇄 | 필수 | ✅ | 학생·교사 |
| F-07 | AI 제출 피드백 (Gemini) | 높음 | ✅ | 학생 |
| F-08 | 교사 대시보드 (제출 조회·삭제) | 필수 | ✅ | 교사 |
| F-09 | 수업지도안 CRUD + AI 생성 | 높음 | ✅ | 교사 |
| F-10 | 유도 질문 (교사 고정 → 학생 노출) | 높음 | ✅ | 교사·학생 |
| F-11 | 탐구보고서 | 높음 | ✅ | 학생 |
| F-12 | 동료 피드백 | 중간 | ✅ | 학생 |
| F-13 | 공유 링크·초대 링크 | 중간 | ✅ | 학생·교사 |
| F-14 | 마이페이지 | 필수 | ✅ | 학생 |
| F-15 | 학습지 사용 현황 | 중간 | ✅ | 학생 |
| F-16 | 클립보드 복사·붙여넣기 차단 | 중간 | ✅ | 학생 |
| F-17 | **수업 설계 3단계** (①~③) | 높음 | ✅ | 교사 |
| F-18 | **학습지 텍스트 배포** | 높음 | ✅ | 교사 |
| F-19 | **모둠 활동 관리** | 높음 | ✅ | 교사 |
| F-20 | **칭찬 배지** | 중간 | ✅ | 교사 |
| F-21 | **통합 작업공간** (`/workspace`) | 중간 | ✅ | 학생 |
| F-22 | **Padlet 생성** (샌드박스·게시판) | 중간 | ✅ | 교사 |
| F-23 | 법적 고지 (개인정보·약관·AI 윤리) | 필수 | ✅ | 전체 |
| F-24 | **탐구질문 챗봇** (학생 슬롯 조립 + AI 폴백) | 높음 | ✅ | 학생 |
| F-24b | **탐구질문 챗봇 설정·로그** | 높음 | ✅ | 교사 |

---

### 6.2 F-03 학습지 작성 (`WorksheetViewer`)

**화면 구성**

1. **WorksheetHeader**: 단원·주제·글쓰기 상황 (전 템플릿 공통)
2. **GuidedQuestionsPanel**: 교사 고정 유도 질문 (학생 직접 작성·수정 가능, **AI 자동 생성 UI 없음**)
3. **InquiryQuestionBotPanel** (`questionBot: true`, F-24): 탐구 질문 슬롯 3칸·규칙 조립·AI 도움받기
4. **TemplateRenderer**: 루틴별 React 컴포넌트
5. **WorksheetClosingSection**: 한 줄 결론 + 셀프 체크 3항
6. **PeerFeedbackSection**: 조건부 동료 피드백
7. **액션**: 임시 저장, 제출, PDF

**교사 설정 반영**

- `guidedQuestionSets` (`pinned: true`) → 헤더·유도 질문 프리필
- `worksheetContent/{templateId}` → 배포된 안내 문구 (교사 ③에서 발행)

**Firestore**: `submissions` — `draft` | `submitted`

---

### 6.3 F-04 입력 검증

| 규칙 | 상세 |
|------|------|
| 최소 글자수 | 일반 항목 **40자** |
| 한글 | `hasKorean()` 1자 이상 |
| 예시 방지 | `example-texts.ts` 등록 문구 거부 |
| 마무리 | `closingHeadline` 40자+ (Headline 템플릿 예외) |
| 탐구 질문 (F-24) | `inquiryQuestion` 15자+, 물음표 종결, 예시 문구 거부 |
| 셀프 체크 | 3항 필수 |
| 동료 피드백 | 항목당 40자+ 한글 |

---

### 6.4 F-07 AI 피드백

| 항목 | 내용 |
|------|------|
| API | `POST /api/feedback` |
| 모델 | Google Gemini |
| 출력 | `rating`: 잘함/보통/노력요함, `feedback` (≤200자) |
| 학생 쿼터 | 1인 1일 1회 |
| 전체 쿼터 | `GEMINI_DAILY_LIMIT` (기본 100) |
| 초과 시 | 제출 허용, AI만 생략 |
| 상태 | `GET /api/ai-status?studentUid=` |

**교사 전용 AI** (학생 UI 미노출)

- `POST /api/guided-questions` — 유도 질문 생성
- `POST /api/lesson-plans/generate` — 지도안 생성
- `POST /api/worksheet-content` — 학습지 텍스트 AI 보조

---

### 6.5 F-09 수업지도안 (`/teacher/lesson-plans`)

- **탐구 단계**: 질문하기 / 탐구하기 / 일반화하기 / 전이하기 (+ 성찰하기)
- **사고도구**: 주 1개 + 성찰 1개 (중복 불가)
- **필드**: 단원·차시·핵심 아이디어·성취기준·탐구 지식·과정·가치·평가·수업 전개 표
- **AI 생성** + 수동 편집
- **Firestore**: `lessonPlans/{id}`
- **단원 프리셋**: 「3. 용해와 용액」 차시별 시드 데이터

---

### 6.6 F-10 유도 질문 (`/teacher/guided-questions`)

- 템플릿·단원·주제·글쓰기 상황 입력
- AI 4~5문항 생성 (교사 화면)
- **「학생에게 제공」** (`pinned: true`) → 학생 활동지에 자동 반영
- 학생 답변: `guided_q_0` … 필드
- **Firestore**: `guidedQuestionSets/{id}`

---

### 6.6a F-24 탐구질문 챗봇 (학생)

**목적**: Wonder·Puzzle 등 질문 단계에서 검증 가능한 탐구 질문 형성 — **규칙 우선, AI 폴백**, 무상태(히스토리 미전송).

**적용 범위**: `resolveTemplate()` — legacy 제외 전 템플릿 `questionBot: true` (PRD v1.0은 see-think-wonder 등 3종 명시, v2.0 구현은 전체 학습지 반영).

**슬롯 3칸** (`qbObserved`, `qbChange`, `qbMeasure`):

| 슬롯 | 의미 | 상한 |
|------|------|------|
| ① | 관찰 사실 | 60자 |
| ② | 조작 변인 | 20자 |
| ③ | 종속 변인 | 20자 |

**흐름**: 슬롯 ②③ 충족 → 클라이언트 `assembleQuestion()` (네트워크 0) → 체크 3항 → 「이 질문으로」 확정 → `meta.inquiryQuestion`·제출 values 저장.

**AI 폴백**: 「막혔어요」 클릭 시 `POST /api/inquiry-question-bot` (`mode: refine`) — 되묻기 1문장 + 후보 2개, `maxOutputTokens: 200`, JSON 스키마 강제.

**토큰 절감**: T1 규칙 조립, T2 히스토리 미전송, T3 입력 절단, T4 출력 상한, T5 `questionBotCache`, T6 `questionBotTurns`/`questionBotPeriods` (F-07과 분리).

**쿼터**: 차시당 3턴·1일 5턴(환경 변수·교사 `turnLimit` 설정).

**컴포넌트**: `InquiryQuestionBotPanel`, `QuestionSlotFields` — `WorksheetViewer` 내 GuidedQuestionsPanel 아래.

**API**: `POST /api/inquiry-question-bot`, `GET /api/ai-status` (`questionBot` 필드).

**Firestore**: `inquiryQuestionSessions/{id}`, `questionBotCache/{hash}` (Admin 전용).

---

### 6.6b F-24b 탐구질문 챗봇 설정·로그 (교사)

- **설정**: `/teacher/question-bot` — `teachers/{uid}.questionBotConfig` (`enabled`, `turnLimit`, `unitHints`)
- **로그**: `/teacher/question-bot/logs` — 초기→최종 질문, 질 점수(0~3), `GET /api/inquiry-question-bot/sessions` (교사 Bearer)
- **연동**: 확정 질문 → F-11 탐구보고서 `inquiryProblem` 프리필 (`prefillConsolidatedFromWorksheet`)

---

### 6.7 F-17 수업 설계 3단계 (`TeachingDesignSteps`)

교사 대시보드에서 **① → ② → ③** 순서로 연동 설계.

| 단계 | 경로 | 기능 |
|------|------|------|
| ① 사고 활동지 | `/teacher/thinking-worksheets` | 단원·차시·학습 주제, 템플릿(사고도구) 선택, URL 쿼리 연동 |
| ② 수업지도안 | `/teacher/lesson-plans` | ① 주제 연동, 사고도구·지도안 작성 |
| ③ 학습지 텍스트 | `/teacher/worksheet-content` | ①·② 연동 안내 문구 편집, AI 보조, **학생 배포** |

**URL 파라미터**: `unitId`, `period`, `learningTopic`, `templateId` — 단계 간 컨텍스트 유지

---

### 6.8 F-18 학습지 텍스트 배포

- **스키마**: `src/lib/worksheet-content/registry.ts` — 템플릿별 필드 정의
- **편집**: 단원·주제·탐구질문·안내·힌트 등
- **발행**: Firestore `worksheetContent/{templateId}`
- **API**: `POST /api/worksheet-content` (AI 수정 옵션)
- 학생 `/templates/[id]`에서 교사 배포 텍스트 로드

---

### 6.9 F-11 탐구보고서

- **경로**: `/inquiry-report`, `/inquiry-report/view/[token]`
- **섹션**: 궁구 내용, 탐구 문제, 알고 있는 것, 5단계 과정, 결과, 알게 된 점, 시각화(캔버스) 등
- **Firestore**: `inquiryReports/{id}`, `inquiryReportShares/{token}`
- **교사**: `TeacherInquiryReports` 대시보드 컴포넌트

---

### 6.10 F-12 동료 피드백

- 같은 반·제출 완료 활동지/탐구보고서 대상
- 항목: 나와 다른 점, 잘한 점, 궁금한 점
- **Firestore**: `peerFeedbacks/{id}`
- 교사: `TeacherPeerFeedbacks`

---

### 6.11 F-13 공유·초대

| 유형 | 경로 | 설명 |
|------|------|------|
| 제출 공유 | `/share/[token]` | 학습지 읽기 전용 |
| 탐구보고서 공유 | `/inquiry-report/view/[token]` | 보고서 읽기 전용 |
| 교사 초대 | `/join/[token]` | 학생 로그인 후 해당 활동지·보고서·workspace로 이동 |
| 초대 생성 | `TeacherStudentInvitePanel` | 활동지 / 탐구보고서 / workspace 링크 |

**Firestore**: `shares/{token}`, `teacherInvites/{token}`

---

### 6.12 F-19 모둠 활동 (`/teacher/groups`)

**섹션 (GroupActivityManager)**

| # | 기능 | 설명 |
|---|------|------|
| 1 | 명렬표 | 반별 학생 등록, Excel 가져오기·내보내기, 성취 수준(상/중/하) |
| 2 | 분리 조건 | 같은 모둠 금지 쌍 드래그 설정 |
| 4 | 모둠 편성 | 6모둠 자동 배정 (성취·성별·분리 규칙 반영) |
| 5 | 역할 부여 | 주간 역할표 (4종 역할 코드), 학생 화면 조회 |
| 6 | 칭찬 | 모둠 활동 칭찬 기록 |

**Firestore (교사 하위)**

- `teachers/{uid}/classRosters`, `groupRosterStudents`, `groupSeparations`, `groupAssignments`, `groupActivityPraises`
- `groupRoleSchedules/{scheduleId}`, `classGroupPraises/{id}`

**학생**: 같은 반 `groupRoleSchedules` 읽기

---

### 6.13 F-20 칭찬 배지 (`/teacher/badges`)

- **배지 정의**: 라벨, 아이콘(5색 상의), 순서, 활성 여부
- **기본 시드**: 5종 프리셋
- **수여·회수**: 제출 활동지에서 빠른 수여 (`TeacherAwardBadgeQuick`) 또는 배지 관리 화면
- **Firestore**: `badgeDefinitions/{id}`, `studentBadges/{id}`
- **학생**: `/my`에서 본인 배지 조회

---

### 6.14 F-21 통합 작업공간 (`/workspace`)

- 활동지 + 탐구보고서 **2분할** 통합 편집
- 다중 제출본·보고서 탭, URL 쿼리 연동
- 교사 workspace 초대 링크 지원

---

### 6.15 F-22 Padlet 생성 (`/teacher/padlet`)

**인증**: Google 교사 Firebase ID token → 서버 `requireTeacherRequest`

**환경 변수** (Vercel 서버 전용): `PADLET_API_KEY`, 선택 `PADLET_DEFAULT_WORKSPACE_ID`, `PADLET_DEFAULT_ROLE`

#### 6.15.1 샌드박스

6종 레이아웃 중 선택 → Padlet AI Recipe Board 생성

| ID | 유형 |
|----|------|
| `wall` | 벽형 |
| `stream` | 스트림 |
| `grid` | 격자 |
| `map` | 지도 |
| `canvas` | 캔버스 |
| `shelf` | 컬럼(선반) |

- 기본 **파스텔 톤** AI 지시문 포함

#### 6.15.2 게시판 (컬럼형)

- **레이아웃**: Column / Shelf (기본)
- **컬럼 모드** (택 1):
  - `groups`: **1모둠 ~ 6모둠** (6컬럼)
  - `numbers`: **1번 ~ 25번** (25컬럼)
- 생성 후 **컬럼별 안내 카드** API 자동 반영 (섹션 매칭 + 파스텔 post color)
- 주제 입력 필드

#### 6.15.3 맞춤 생성

- 교사가 직접 AI 지시문 입력 (≤2000자)

#### 6.15.4 API 라우트

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/padlet/status` | API 키 설정 여부 |
| POST | `/api/padlet/boards` | 보드 생성 (+ 컬럼 시드) |
| GET | `/api/padlet/boards/status/[statusKey]` | AI 생성 진행 상태 |
| GET | `/api/padlet/boards/[boardId]` | 보드 조회 |
| POST | `/api/padlet/boards/[boardId]/posts` | 게시글 추가 |

**외부 API**: `https://api.padlet.dev/v1` — `X-Api-Key` 헤더

---

### 6.16 F-08 교사 대시보드 (`/teacher`)

- 전체 학생 **제출·임시저장** 목록, 일별 표 (`TeacherDailyTable`)
- **명렬·활동 요약** (`TeacherClassRoster`)
- 제출 **상세 펼치기**, **삭제**, **AI 피드백** 표시
- **유도 질문·활동지 내용** 구분 표시
- **빠른 배지 수여**
- **학생 초대 링크** 패널
- **탐구보고서·동료피드백** 하단 패널
- 네비: 모둠·배지·①~③·유도질문·**패들렛**

---

### 6.17 F-16 학습 무결성

- `StudentClipboardGuard`: 학생 로그인 시 복사·붙여넣기·잘라내기·드래그 차단
- `example-texts.ts` 예시 문구 제출 거부 (이중 방어)

---

## 7. 화면 IA (Information Architecture)

| 경로 | 설명 | 역할 |
|------|------|------|
| `/` | 홈 — 템플릿 그리드(7범주), 탐구보고서入口 | 전체 |
| `/login` | 학생·교사 로그인, 이용 동의 | 전체 |
| `/templates/[id]` | 학습지 작성 | 학생·게스트 |
| `/my` | 내 제출·배지·기록 | 학생 |
| `/workspace` | 통합 작업공간 | 학생 |
| `/inquiry-report` | 탐구보고서 편집 | 학생 |
| `/share/[token]` | 공유 읽기 전용 | 전체 |
| `/join/[token]` | 교사 초대 딥링크 | 학생 |
| `/teacher` | 교사 대시보드 | 교사 |
| `/teacher/thinking-worksheets` | ① 사고 활동지 설계 | 교사 |
| `/teacher/lesson-plans` | ② 수업지도안 | 교사 |
| `/teacher/worksheet-content` | ③ 학습지 텍스트 | 교사 |
| `/teacher/guided-questions` | 유도 질문 | 교사 |
| `/teacher/groups` | 모둠 활동 | 교사 |
| `/teacher/badges` | 칭찬 배지 | 교사 |
| `/teacher/padlet` | Padlet 생성 | 교사 |
| `/privacy`, `/terms`, `/ai-ethics` | 법적·윤리 고지 | 전체 |

---

## 8. 시스템 아키텍처

### 8.1 계층

```
[Browser — React 19 Client]
   ├── Next.js 15 App Router
   │     ├── 페이지 (SSG/CSR)
   │     └── /api/* Route Handlers (Node.js)
   │
   ├── Firebase Client (Auth, Firestore)
   └── public/*.html (Standalone)

[Server — Vercel]
   ├── Firebase Admin SDK (학생 로그인, AI 쿼터)
   ├── Google Gemini API
   └── Padlet API (교사 전용)
```

### 8.2 API 라우트 전체

| 경로 | 용도 |
|------|------|
| `/api/auth/student-login` | 학생 custom token |
| `/api/feedback` | AI 제출 피드백 |
| `/api/ai-status` | AI 쿼터 조회 |
| `/api/guided-questions` | 유도 질문 AI |
| `/api/lesson-plans/generate` | 지도안 AI |
| `/api/worksheet-content` | 학습지 텍스트 AI |
| `/api/padlet/*` | Padlet 연동 |

### 8.3 Firestore 컬렉션

| 컬렉션 | 용도 |
|--------|------|
| `students/{uid}` | 학생 프로필 |
| `teachers/{uid}` | 교사 프로필·accessPin |
| `studentAccessPins/{pin}` | 6자리 → teacherUid |
| `submissions/{id}` | 학습지 |
| `inquiryReports/{id}` | 탐구보고서 |
| `peerFeedbacks/{id}` | 동료 피드백 |
| `lessonPlans/{id}` | 지도안 |
| `guidedQuestionSets/{id}` | 유도 질문 |
| `worksheetContent/{templateId}` | 배포 텍스트 |
| `shares/{token}` | 공유 |
| `teacherInvites/{token}` | 초대 |
| `badgeDefinitions/{id}` | 배지 정의 |
| `studentBadges/{id}` | 배지 수여 |
| `groupRoleSchedules/{id}` | 주간 역할 |
| `classGroupPraises/{id}` | 모둠 칭찬 |
| `teachers/{uid}/*` | 명렬·편성·분리·칭찬 |
| `apiQuota/{date}/students/{uid}` | AI 사용량 |

### 8.4 핵심 모듈

| 경로 | 책임 |
|------|------|
| `src/lib/templates/registry.ts` | 44종 템플릿 |
| `src/lib/worksheet-validation.ts` | 제출 검증 |
| `src/lib/lesson-plan/` | 지도안·사고도구 |
| `src/lib/curriculum/design-flow.ts` | 3단계 설계 URL·프리셋 |
| `src/lib/group-activity/` | 모둠 편성·역할 |
| `src/lib/padlet/` | Padlet 클라이언트·프리셋·서버 |
| `src/lib/firebase/teacher-auth.ts` | 교사·학생 역할 |
| `src/components/AuthGate.tsx` | 라우트 보호 |

---

## 9. 비기능 요구사항

### 9.1 배포·환경

- **배포**: Vercel Production (`*.vercel.app`)
- **금지**: Firebase Hosting URL 단독 사용 (API Route 없음)
- **Deployment Protection**: Production에서 Vercel Authentication **비활성화** (학생 API fetch HTML 방지)
- **환경 변수**: Vercel Dashboard **만** 사용 — `.env` / `.env.local` **미사용**

### 9.2 환경 변수 (부록 A)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` (6개) | 클라이언트 Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Admin SDK |
| `STUDENT_AUTH_SECRET` | 학생 Auth 내부 비밀 |
| `GEMINI_API_KEY` | AI |
| `GEMINI_DAILY_LIMIT` | AI 일일 한도 |
| `PADLET_API_KEY` | Padlet (서버) |
| `PADLET_DEFAULT_WORKSPACE_ID` | Padlet (선택) |
| `PADLET_DEFAULT_ROLE` | Padlet AI 역할 (선택) |

### 9.3 보안

- API 키·Admin JSON **클라이언트 미노출**
- Firestore Security Rules — Google 교사 / 학생 도메인 분리
- 교사 Padlet·AI API: Bearer Firebase ID token 검증
- COOP 헤더: `/login`, `/teacher`, `/` — Google OAuth 팝업

### 9.4 성능

- 템플릿 SSG (`generateStaticParams`, 44+ 경로)
- Padlet AI 생성: 비동기 30초~2분, 상태 폴링 지원

### 9.5 UI/UX

- Tailwind CSS 4, Pretendard/Noto Sans KR
- 모바일 우선, 인쇄 `@media print` A4
- 초등 교실: 파스텔톤, scannable 레이아웃

---

## 10. 사용자 시나리오

### 10.1 학생 — 활동지 제출

```mermaid
flowchart TD
    A[/join 또는 /login] --> B[6자리 암호]
    B --> C[/templates/id]
    C --> D[교사 유도질문·안내문 반영]
    D --> E[작성 + 마무리]
    E --> F{검증}
    F -->|실패| E
    F -->|성공| G[제출 + AI 피드백]
    G --> H[/my]
```

### 10.2 교사 — 수업 설계 + Padlet

```mermaid
flowchart TD
    A[Google + 6자리 암호] --> B[① 사고 활동지]
    B --> C[② 지도안]
    C --> D[③ 학습지 텍스트 배포]
    D --> E[유도 질문 pin]
    E --> F[/teacher 제출 모니터]
    F --> G[Padlet 게시판 6모둠 생성]
```

---

## 11. 데이터 모델 (요약)

### 11.1 WorksheetSubmission

```typescript
{
  templateId: string;
  templateName: string;
  meta: { grade, classNo, studentNo, studentName, unit, topic, writingContext, ... };
  values: Record<string, string>;  // guided_q_*, 루틴 필드
  studentUid: string;
  status: "draft" | "submitted";
  submittedAt: Timestamp | null;
  aiFeedback?: string;
  aiRating?: "잘함" | "보통" | "노력요함";
}
```

### 11.2 TeacherProfile

```typescript
{
  email: string;
  displayName: string;
  accessPin: string;  // 6자리
}
```

---

## 12. v2.0 범위 및 Backlog

### 12.1 v2.0 포함 (구현 완료)

- 44종 React 템플릿 + 4종 HTML
- 서버 학생 로그인, 교사 Google + 6자리 PIN
- 3단계 수업 설계, 학습지 텍스트 배포
- 모둠 편성·역할·칭찬, 배지
- Padlet 샌드박스 6종 + 컬럼 게시판
- 초대·workspace·법적 고지
- Vercel 전용 env, Admin SDK jose v4 호환

### 12.2 Backlog

- Chalk Talk 실시간 협업 (Padlet 외 네이티브)
- Zoom In 단계적 이미지
- LMS LTI 연동
- PWA·오프라인 persistence
- Padlet 보드 목록·수정·삭제 UI

---

## 13. 개정 이력

| 버전 | 일자 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-06 | 최초 작성 — 44템플릿, CSI, 공통 마무리, AI 피드백 |
| **2.0** | **2026-07** | **전면 개정** — 3단계 수업 설계, 서버 학생 로그인·6자리 PIN, 모둠·배지, Padlet API, workspace·초대, env 정책, 교사 auth 안정화, 유도질문 학생 AI 숨김, 공통 헤더 필드 |

---

## 부록 A. 용어 정의

| 용어 | 정의 |
|------|------|
| 사고도구 | Visible Thinking 등 구조화 사고·글쓰기 프레임워크 |
| 글쓰기 상황 | `writingContext` — 실험·관찰 맥락 |
| 공통 마무리 | 한 줄 결론 + 메타인지 셀프 체크 3항 |
| AI Recipe Board | Padlet AI 비동기 보드 생성 API |
| teacher-pending | Google 로그인 후 PIN 미입력 교사 상태 |

---

## 부록 B. 논문 인용 예시

> 본 연구에서 개발한 「사고도구 톡톡」(v2.0, 2026)은 Project Zero Visible Thinking 44종을 웹 학습지로 구현하고, 교사 3단계 수업 설계·6자리 교실 암호 기반 학생 인증·모둠 편성·Padlet 컬럼형 협업 게시판·Gemini 보조 피드백을 통합한 초등 과학 디지털 학습 환경이다.

---

*본 문서는 sagodogu-toktok 저장소 **main 브랜치 (2026-07)** 구현 상태를 기준으로 작성되었다.*
