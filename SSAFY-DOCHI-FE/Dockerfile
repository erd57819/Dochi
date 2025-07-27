# 멀티 스테이지 빌드
# Stage 1: Build
FROM node:22 AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY ../nginx/nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일을 Nginx 서버로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 3000 노출
EXPOSE 3000

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]