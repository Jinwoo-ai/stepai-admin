# StepAI Admin CMS

StepAI API를 위한 관리자 페이지입니다.

## 🚀 기능

- **대시보드**: 전체 통계 확인
- **AI 서비스 관리**: AI 서비스 CRUD 및 노출 설정
- **AI 영상 관리**: AI 영상 콘텐츠 관리 (준비 중)
- **카테고리 관리**: 계층적 카테고리 구조 관리 (준비 중)
- **큐레이션 관리**: AI 서비스 큐레이션 관리 (준비 중)

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Create React App
- **HTTP Client**: Fetch API
- **Styling**: CSS

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

### 3. 빌드
```bash
npm run build
```

## 🎯 주요 기능

### AI 서비스 관리
- AI 서비스 목록 조회
- 새 AI 서비스 등록
- 기존 AI 서비스 수정
- AI 서비스 삭제
- **사이트 노출 여부 토글** (👁️ 아이콘)

### 대시보드
- 전체 데이터 통계 확인

## 🔧 API 연동

기본 API URL: `http://localhost:3000`

### AI 서비스 API
- `GET /api/ai-services` - 목록 조회
- `POST /api/ai-services` - 생성
- `PUT /api/ai-services/:id` - 수정
- `DELETE /api/ai-services/:id` - 삭제

## 📱 반응형 디자인

모바일 및 태블릿에서도 사용 가능한 반응형 디자인을 지원합니다.

## 🚀 배포

```bash
npm run build
# build 폴더를 웹 서버에 배포
```

## 📝 TODO

- [ ] AI 영상 관리 페이지 구현
- [ ] 카테고리 관리 페이지 구현 (트리 구조)
- [ ] 큐레이션 관리 페이지 구현
- [ ] 사용자 관리 페이지 구현
- [ ] 파일 업로드 기능
- [ ] 검색 및 필터링 기능
- [ ] 페이지네이션
- [ ] 로딩 및 에러 상태 처리
- [ ] 인증 시스템