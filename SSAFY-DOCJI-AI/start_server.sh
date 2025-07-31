#!/bin/bash

# AI 서버 실행 스크립트

echo "=== 참견도치 AI 서버 실행 스크립트 ==="

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "스크립트 위치: $SCRIPT_DIR"

# Python 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    echo "가상환경 활성화 중..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "가상환경 활성화 중..."
    source .venv/bin/activate
fi

# 필요한 패키지 설치 확인
echo "필요한 패키지 설치 확인 중..."
pip install -r requirements.txt

# 환경변수 설정
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}"

# 서버 실행
echo "AI 서버 시작 중..."
echo "포트: 8000"
echo "API 문서: http://localhost:8000/docs"
echo "음성 분석 API: http://localhost:8000/speech/"
echo "WebSocket: ws://localhost:8000/ws/speech-analysis/{room_id}/{user_id}"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload