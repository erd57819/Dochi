FROM nginx:alpine

# OpenSSL 설치 (자체 서명 인증서 생성용)
RUN apk add --no-cache openssl

# 자체 서명 SSL 인증서 생성
RUN mkdir -p /etc/ssl/certs /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=KR/ST=Seoul/L=Seoul/O=SSAFY/OU=C209/CN=i13c209.p.ssafy.io"

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 포트 노출
EXPOSE 80 443

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]