@echo off
echo === Git Stash and Pull ===
echo.

echo 1. 현재 변경사항을 임시 저장합니다...
git stash push -m "vite config and other local changes"

echo.
echo 2. 원격 저장소에서 최신 코드를 가져옵니다...
git pull origin master

echo.
echo 3. 임시 저장된 변경사항을 다시 적용합니다...
git stash pop

echo.
echo === 완료 ===
pause
