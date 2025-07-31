@echo off
echo === NPM 의존성 설치 ===
echo.

echo 1. 기존 node_modules 삭제...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo.
echo 2. 의존성 재설치...
npm install

echo.
echo 3. 개발 서버 시작...
npm run dev

echo.
echo === 완료 ===
pause
