#!/bin/bash

# Let's Encrypt 인증서 설치 스크립트
# EC2 서버에서 실행해야 함

# Certbot 설치
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 도메인에 대한 SSL 인증서 발급
# 실행 전 nginx가 80 포트에서 실행 중이어야 함
sudo certbot --nginx -d i13c209.p.ssafy.io --email your-email@example.com --agree-tos --non-interactive

# 자동 갱신 설정
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "Let's Encrypt 인증서가 설치되었습니다."
echo "nginx 설정에서 주석 처리된 Let's Encrypt 인증서 경로를 해제하고 자체 서명 인증서는 주석 처리하세요."