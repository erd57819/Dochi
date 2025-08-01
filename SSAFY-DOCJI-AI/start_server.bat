@echo off
chcp 65001 >nul

echo === 참견도치 AI 서버 실행 스크립트 ===

:: 현재 디렉토리로 이동
cd /d "%~dp0"
echo 스크립트 위치: %cd%

:: Python 가상환경 활성화 (있는 경우)
if exist "venv\Scripts\activate.bat" (
    echo 가상환경 활성화 중...
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    echo 가상환경 활성화 중...
    call .venv\Scripts\activate.bat
)

:: 필요한 패키지 설치 확인
echo 필요한 패키지 설치 확인 중...
pip install -r requirements.txt

:: 서버 실행
echo.
echo AI 서버 시작 중...
echo 포트: 8002 (도커와 동일)
echo API 문서: http://localhost:8002/docs
echo 음성 분석 API: http://localhost:8002/speech/
echo WebSocket: ws://localhost:8002/ws/speech-analysis/{room_id}/{user_id}
echo.
echo 서버 종료: Ctrl+C
echo.

uvicorn main:app --host 0.0.0.0 --port 8002 --reload

pause