# Stage 1: Build
FROM maven:3.9.4-eclipse-temurin-17 AS builder

WORKDIR /app

# pom.xml 먼저 복사 (의존성 캐싱을 위해)
COPY pom.xml .

# 의존성 다운로드 (캐시 레이어)
RUN mvn dependency:go-offline -B

# 전체 소스 복사
COPY . .

# Maven 빌드 실행 (명시적으로 install 목표 사용)
RUN mvn clean install -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 타임존 설정 및 필요한 패키지 설치
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    apk del tzdata

# 비루트 사용자 생성
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring

# 애플리케이션 JAR 파일 복사 (명시적으로 파일명 지정)
COPY --from=builder /app/target/dochi-be-*.jar app.jar

# 소유권 변경
RUN chown spring:spring app.jar

USER spring

# 포트 노출
EXPOSE 8080

# JVM 옵션 설정
ENV JAVA_OPTS="-Xms512m -Xmx1024m -Djava.security.egd=file:/dev/./urandom"

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 애플리케이션 실행 (Maven 대신 직접 JAR 실행)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]