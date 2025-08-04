@echo off
echo === 강제 Git Pull (로컬 변경사항 무시) ===
echo.

echo 1. 로컬 변경사항을 모두 버립니다...
git reset --hard HEAD

echo.
echo 2. 원격 저장소와 강제로 동기화합니다...
git reset --hard origin/master

echo.
echo 3. 최신 코드를 가져옵니다...
git pull origin master

echo.
echo === 완료 ===
echo 로컬 변경사항이 모두 사라지고 원격 저장소와 동일해졌습니다.
pause
