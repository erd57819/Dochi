@echo off
echo === Git Push sunwoo 브랜치 ===
echo.

echo 1. 원격 sunwoo 브랜치에서 최신 변경사항 가져오기...
git pull origin sunwoo

echo.
echo 2. Push 시도...
git push origin sunwoo

echo.
if %ERRORLEVEL% EQU 0 (
    echo === Push 성공! ===
) else (
    echo === Push 실패 ===
    echo 충돌이 있다면 수동으로 해결 후 다시 시도하세요.
)

pause
