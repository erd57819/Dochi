-- =================================================================================
-- 사용자 관련 테이블
-- =================================================================================

-- 사용자 정보
CREATE TABLE `users` (
                         `id`              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 고유 ID (PK)',
                         `user_id`         VARCHAR(50)     NOT NULL UNIQUE COMMENT '로그인 아이디',
                         `name`            VARCHAR(50)     NOT NULL COMMENT '이름',
                         `nickname`		  VARCHAR(50)     NOT NULL COMMENT '닉네임',
                         `email`           VARCHAR(100)    NOT NULL UNIQUE COMMENT '이메일',
                         `password`        VARCHAR(255)    NOT NULL COMMENT '암호화된 비밀번호',
                         `address`         VARCHAR(500)    NULL COMMENT '주소',
                         `age`             INT             NULL COMMENT '나이',
                         `gender`          ENUM('MALE', 'FEMALE', 'NONE') NULL COMMENT '성별',
                         `role`            ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER' COMMENT '역할',
                         `is_Social` boolean DEFAULT FALSE,
                         `kakao_id` varchar(255) DEFAULT NULL,
                         `google_id` VARCHAR(255) DEFAULT NULL COMMENT '구글 로그인 고유 ID',
                         `email_verified`  BOOLEAN         NOT NULL DEFAULT FALSE COMMENT '이메일 인증 여부',
                         `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입일시',
                         `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정일시',
                         `refresh_token` varchar(512) DEFAULT NULL,
                         `profile_image`   VARCHAR(255)    NULL COMMENT '프로필 이미지 URL'

);



-- 사용자 세션 (화상채팅 정보)
CREATE TABLE `user_sessions` (
    `id`              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id`      VARCHAR(255)    NOT NULL UNIQUE COMMENT '세션 고유 ID',
    `user_id`         BIGINT          NOT NULL COMMENT '사용자 ID (FK)',
    `expires_at`      DATETIME        NOT NULL COMMENT '만료일시',
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 이메일 인증
CREATE TABLE `email_verification` (
    `id`                BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `email`             VARCHAR(100)    NOT NULL,
    `verification_code` VARCHAR(10)     NOT NULL COMMENT '인증번호',
    `expires_at`        DATETIME        NOT NULL COMMENT '만료시간',
    `is_verified`       BOOLEAN         NOT NULL DEFAULT FALSE,
    `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE email_verification ADD UNIQUE(email);

-- =================================================================================
-- 갈등 및 AI 분석 세션 관련 테이블
-- =================================================================================

-- 사용자가 등록한 갈등 정보
CREATE TABLE `user_conflicts` (
    `id`                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '갈등 고유 ID (PK)',
    `user_id`             BIGINT          NOT NULL COMMENT '갈등을 등록한 사용자 ID (FK)',
    `title`               VARCHAR(200)    NOT NULL COMMENT '갈등 제목',
    `description`         TEXT            NOT NULL COMMENT '갈등 상세 설명',
    `conflict_type`       ENUM('WORK', 'FAMILY', 'FRIEND', 'COUPLE', 'NEIGHBOR', 'FINANCIAL', 'ONLINE', 'ETC') NOT NULL COMMENT '갈등 유형',
    `conflict_when`       INT             NULL COMMENT '갈등 발생 시점 (예: 3일 전)',
    `conflict_frequency`  INT             NULL COMMENT '갈등 발생 빈도 (월 N회)',
    `participants`        JSON            NULL COMMENT '갈등 참여자 정보',
    `desired_outcome`     TEXT            NULL COMMENT '원하는 결과',
    `priority`            ENUM('RELATIONSHIP', 'SOLUTION', 'SELF_CARE', 'PREVENTION', 'NONE') NULL COMMENT '중요하게 생각하는 가치',
    `talk_willingness`    ENUM('YES', 'MAYBE', 'NO', 'NONE') NOT NULL DEFAULT 'NONE' COMMENT '대화 의지',
    `initial_emotion`     ENUM('ANGER', 'SADNESS', 'FRUSTRATION', 'ETC') NULL COMMENT '갈등에 대한 주된 감정',
    `intensity`           INT             NOT NULL COMMENT '갈등 강도 (1-10)',
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- AI 분석 대화 세션
CREATE TABLE `sessions` (
    `id`            BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '세션 고유 ID (PK)',
    `conflict_id`   BIGINT          NOT NULL COMMENT '연관된 갈등 ID (FK)',
    `status`        ENUM('STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'STARTED' COMMENT '세션 상태',
    `started_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '세션 시작 시간',
    `ended_at`      DATETIME        NULL COMMENT '세션 종료 시간',
    FOREIGN KEY (`conflict_id`) REFERENCES `user_conflicts`(`id`) ON DELETE CASCADE
);

-- 감정 분석 로그
CREATE TABLE `emotion_analysis_logs` (
    `id`                   BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id`           BIGINT          NOT NULL COMMENT '세션 ID (FK)',
    `user_id`              BIGINT          NOT NULL COMMENT '분석 대상 사용자 ID (FK)',
    `analysis_timestamp`   DECIMAL(10, 3)  NOT NULL COMMENT '세션 시작 기준 시간(초)',
    `audio_analysis`       JSON            NULL COMMENT '음성 감정 분석 결과',
    `video_analysis`       JSON            NULL COMMENT '영상 감정 분석 결과',
    `combined_analysis`    JSON            NULL COMMENT '종합 감정 분석 결과',
    `dominant_emotion`     VARCHAR(50)     NULL,
    `emotion_intensity`    DECIMAL(3, 1)   NULL COMMENT '감정 강도',
    `authenticity_score`   DECIMAL(3, 2)   NULL COMMENT '진정성 점수',
    `created_at`           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_session_timestamp` (`session_id`, `analysis_timestamp`)
);

-- STT (Speech-to-Text) 변환 결과
CREATE TABLE `stt_transcripts` (
    `id`             BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id`     BIGINT          NOT NULL COMMENT '세션 ID (FK)',
    `user_id`        BIGINT          NOT NULL COMMENT '발화자 ID (FK)',
    `speaker_name`   VARCHAR(50)     NOT NULL COMMENT '발화자 이름',
    `text`           TEXT            NOT NULL COMMENT '변환된 텍스트',
    `confidence`     DECIMAL(3, 2)   NULL COMMENT 'STT 신뢰도',
    `start_time`     DECIMAL(10, 3)  NOT NULL COMMENT '시작 시간(초)',
    `end_time`       DECIMAL(10, 3)  NOT NULL COMMENT '종료 시간(초)',
    `words_detail`   JSON            NULL COMMENT '단어별 상세 정보',
    `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- AI 중재 기록
CREATE TABLE `ai_interventions` (
    `id`                     BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id`             BIGINT          NOT NULL COMMENT '세션 ID (FK)',
    `intervention_timestamp` DECIMAL(10, 3)  NOT NULL COMMENT '중재 시점(초)',
    `trigger_type`           ENUM('AUTOMATIC_EMOTION_THRESHOLD', 'MANUAL_REQUEST', 'PATTERN_DETECTED', 'ESCALATION_RISK') NOT NULL,
    `intervention_type`      ENUM('DE_ESCALATION', 'EMOTIONAL_VALIDATION', 'STRUCTURED_DIALOGUE', 'BREAK_SUGGESTION') NOT NULL,
    `emotional_context`      JSON            NULL COMMENT '중재 시점 감정 상황',
    `conversation_context`   JSON            NULL COMMENT '대화 맥락',
    `ai_message`             TEXT            NULL COMMENT 'AI 중재 메시지',
    `suggested_actions`      JSON            NULL COMMENT '제안된 행동',
    `effectiveness_score`    DECIMAL(3, 1)   NULL COMMENT '중재 효과성 점수',
    `user_feedback`          JSON            NULL COMMENT '사용자 피드백',
    `created_at`             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
);

-- 세션 요약 정보
CREATE TABLE `session_summaries` (
    `id`                       BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `session_id`               BIGINT      NOT NULL UNIQUE COMMENT '세션 ID (FK), 하나의 세션은 하나의 요약만 가짐',
    `duration_seconds`         INT         NOT NULL COMMENT '총 세션 시간',
    `speaking_ratio`           JSON        NULL COMMENT '발화 비율',
    `emotional_timeline`       JSON        NULL COMMENT '감정 변화 타임라인',
    `key_moments`              JSON        NULL COMMENT '주요 순간들',
    `intervention_count`       INT         NOT NULL DEFAULT 0 COMMENT 'AI 중재 횟수',
    `resolution_outcome`       JSON        NULL COMMENT '해결 결과',
    `agreed_actions`           JSON        NULL COMMENT '합의된 행동',
    `ai_analysis`              JSON        NULL COMMENT 'AI 종합 분석',
    `improvement_areas`        JSON        NULL COMMENT '개선 영역',
    `participant_satisfaction` JSON        NULL COMMENT '참여자 만족도',
    `created_at`               DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
);

-- 최종 분석 리포트
CREATE TABLE `final_analysis_reports` (
    `id`                          BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '리포트 고유 ID',
    `session_id`                  BIGINT   NOT NULL COMMENT '분석 대상 세션 ID (FK)',
    `user_id`                     BIGINT   NOT NULL COMMENT '리포트 요청 사용자 ID (FK)',
    `conversation_analysis`       TEXT     NULL COMMENT '대화 내용 요약 및 분석',
    `emotion_timeline_analysis`   JSON     NULL COMMENT '감정 변화 타임라인 분석 데이터',
    `final_action_plan`           TEXT     NULL COMMENT '최종 합의된 실행 계획',
    `responsibility_assessment`   JSON     NULL COMMENT '참여자별 책임 비율 및 근거',
    `created_at`                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '리포트 생성 일시',
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- =================================================================================
-- 커뮤니티 관련 테이블
-- =================================================================================

-- 커뮤니티 게시글
CREATE TABLE `community_posts` (
    `id`            BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`       BIGINT               NULL COMMENT '작성자 ID (FK)',
    `category`      ENUM('CONFLICT_SHARING', 'SUCCESS_STORIES', 'ADVICE_REQUEST', 'GENERAL') NOT NULL,
    `title`         VARCHAR(200)    NOT NULL,
    `content`       TEXT            NOT NULL,
    `view_count`    INT             NOT NULL DEFAULT 0 COMMENT '조회수',
    `comment_count` INT             NOT NULL DEFAULT 0 COMMENT '댓글 수',
    `tags`          JSON            NULL COMMENT '태그 배열',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`    DATETIME        NULL COMMENT '삭제일시 (Soft Delete)',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL, -- 작성자 탈퇴해도 게시글은 남김
    INDEX `idx_category` (`category`)
);

-- 댓글
CREATE TABLE `comments` (
    `id`                  BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `post_id`             BIGINT      NOT NULL COMMENT '게시글 ID (FK)',
    `user_id`             BIGINT      NULL COMMENT '작성자 ID (FK)',
    `parent_comment_id`   BIGINT      NULL COMMENT '부모 댓글 ID (대댓글용)',
    `content`             TEXT        NOT NULL,
    `created_at`          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`          DATETIME    NULL COMMENT '삭제일시 (Soft Delete)',
    FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE, -- 원본글 삭제 시 댓글도 삭제
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE, -- 작성자 탈퇴 시 댓글도 삭제
    FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE -- 부모 댓글 삭제 시 자식 댓글도 삭제
);

-- 게시글 좋아요/싫어요
CREATE TABLE `post_likes` (
    `id`        BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `post_id`   BIGINT      NOT NULL COMMENT '게시글 ID (FK)',
    `user_id`   BIGINT      NOT NULL COMMENT '사용자 ID (FK)',
    `like_type` ENUM('LIKE', 'DISLIKE') NOT NULL,
    `created_at` DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `post_user_unique` (`post_id`, `user_id`),
    FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 댓글 좋아요/싫어요
CREATE TABLE `comment_likes` (
    `id`          BIGINT    NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `comment_id`  BIGINT    NOT NULL COMMENT '댓글 ID (FK)',
    `user_id`     BIGINT    NOT NULL COMMENT '사용자 ID (FK)',
    `like_type`   ENUM('LIKE', 'DISLIKE') NOT NULL,
    `created_at`  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `comment_user_unique` (`comment_id`, `user_id`),
    FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- =================================================================================
-- 챗봇 및 공지사항 관련 테이블
-- =================================================================================

-- 챗봇 채팅방
CREATE TABLE `chat_rooms` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`    BIGINT       NOT NULL COMMENT '채팅방 생성자 ID (FK)',
    `title`      VARCHAR(255) NULL COMMENT '채팅방 제목',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 챗봇 메시지
CREATE TABLE `chat_messages` (
    `id`           BIGINT                 NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `chat_room_id` BIGINT                 NOT NULL COMMENT '채팅방 ID (FK)',
    `sender_type`  ENUM('USER', 'BOT')    NOT NULL COMMENT '발신자 타입',
    `message`      TEXT                   NOT NULL,
    `created_at`   DATETIME               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE
);

-- 공지사항
CREATE TABLE `notices` (
    `id`           BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id`      BIGINT          NOT NULL COMMENT '작성자(관리자) ID (FK)',
    `title`        VARCHAR(200)    NOT NULL,
    `content`      TEXT            NOT NULL,
    `category`     ENUM('SYSTEM', 'UPDATE', 'MAINTENANCE', 'ANNOUNCEMENT') NOT NULL DEFAULT 'ANNOUNCEMENT',
    `is_important` BOOLEAN         NOT NULL DEFAULT FALSE COMMENT '중요 공지 여부',
    `is_popup`     BOOLEAN         NOT NULL DEFAULT FALSE COMMENT '팝업 노출 여부',
    `view_count`   INT             NOT NULL DEFAULT 0,
    `publish_date` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '게시 일시',
    `expire_date`  DATETIME        NULL COMMENT '만료 일시',
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- 영상통화 테스트 테이블 (삭제할수도 있습니다.)
-- 영상통화방 테이블
CREATE TABLE `video_call_rooms` (
                                    `id`              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                    `room_code`       VARCHAR(20)     NOT NULL UNIQUE COMMENT '방 초대 코드',
                                    `host_user_id`    BIGINT          NOT NULL COMMENT '방 생성자 ID (FK)',
                                    `guest_user_id`   BIGINT          NULL COMMENT '참여자 ID (FK)',
                                    `status`          ENUM('WAITING', 'ACTIVE', 'ENDED') NOT NULL DEFAULT 'WAITING' COMMENT '방 상태',
                                    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                    `started_at`      DATETIME        NULL COMMENT '통화 시작 시간',
                                    `ended_at`        DATETIME        NULL COMMENT '통화 종료 시간',
                                    `expires_at`      DATETIME        NOT NULL COMMENT '방 만료 시간 (24시간 후)',
                                    FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                                    FOREIGN KEY (`guest_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
                                    INDEX `idx_room_code` (`room_code`),
                                    INDEX `idx_expires_at` (`expires_at`)
);

-- 영상통화 세션 테이블 (AI 분석용)
CREATE TABLE `video_call_sessions` (
                                       `id`              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                       `room_id`         BIGINT          NOT NULL COMMENT '영상통화방 ID (FK)',
                                       `conflict_id`     BIGINT          NULL COMMENT '연관된 갈등 ID (FK)',
                                       `duration_seconds` INT            NULL COMMENT '통화 시간 (초)',
                                       `ai_analysis_requested` BOOLEAN   NOT NULL DEFAULT FALSE COMMENT 'AI 분석 요청 여부',
                                       `recording_enabled` BOOLEAN       NOT NULL DEFAULT FALSE COMMENT '녹화 여부',
                                       `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                       FOREIGN KEY (`room_id`) REFERENCES `video_call_rooms`(`id`) ON DELETE CASCADE,
                                       FOREIGN KEY (`conflict_id`) REFERENCES `user_conflicts`(`id`) ON DELETE SET NULL
);