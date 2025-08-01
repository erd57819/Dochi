# 멀티 스테이지 빌드
# Stage 1: Build
FROM node:22 AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# npm 캐시 정리 및 의존성 설치 (Rollup 바이너리 문제 해결)
RUN npm cache clean --force && \
    rm -rf node_modules && \
    rm -f package-lock.json && \
    npm install --force --verbose && \
    npm ls @rollup/rollup-linux-x64-gnu || true

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# 기본 nginx.conf 제거 후 간단한 설정 생성
RUN rm /etc/nginx/nginx.conf

# 프론트엔드용 간단한 nginx 설정
RUN echo 'events { worker_connections 1024; } \
http { \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    sendfile on; \
    keepalive_timeout 65; \
    server { \
        listen 80; \
        server_name localhost; \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
    } \
}' > /etc/nginx/nginx.conf

# 빌드된 파일을 Nginx 서버로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 80 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]