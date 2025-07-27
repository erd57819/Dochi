
# Stage 1: Build
FROM maven:4.0.0-eclipse-temurin-17 AS builder

WORKDIR /app

# 전체 빌드에 필요한 파일 복사
COPY . .

# 빌드 실행
RUN mvn clean package -DskipTests


