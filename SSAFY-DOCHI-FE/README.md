# 📦 프로젝트명

> 참견도치

---

## 🛠️ 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| **Frontend Framework** | React |
| **상태 관리** | Zustand |
| **스타일링** | Tailwind CSS |
| **라우팅** | React Router |
| **패키지 매니저** | npm |
| **빌드 도구** | Vite |
| **버전 관리** | npm version |
| **배포** | AWS EC2 + Nginx (정적 파일 배포) |

---

## 📁 프로젝트 구조 (예시)

```
src/
├── assets/           # 이미지, 아이콘
├── components/       # 재사용 가능한 UI 컴포넌트
├── pages/            # 라우팅 페이지 컴포넌트
├── stores/           # Zustand 상태 관리 모듈
├── hooks/            # 커스텀 훅
├── utils/            # 유틸 함수
├── App.tsx
├── main.tsx
```

---

## 🚀 실행 가이드

### 1. 프로젝트 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 빌드
```bash
npm run build
```

---

## 🔀 버전 관리 전략

- `npm version [patch|minor|major]` 명령어로 `package.json`의 버전 업데이트
- Git 자동 커밋 + 태그 생성
- Jenkins 또는 수동으로 `git push --follow-tags` 실행

---

## 🌐 배포 방식

- `npm run build`로 정적 파일 생성
- EC2 서버에 Nginx 설정 후 `/build` 폴더 업로드
- Jenkins 또는 GitLab CI 통해 자동화 가능

---

## 📅 변경 이력 (Changelog)

> 버전 태그 및 주요 변경 사항은 [`CHANGELOG.md`](./CHANGELOG.md) 참고

---
