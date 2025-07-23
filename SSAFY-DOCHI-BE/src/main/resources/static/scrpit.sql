CREATE TABLE `emotion_analysis_logs` (
                                         `id`	BIGINT	NULL,
                                         `session_id`	BIGINT	NOT NULL,
                                         `user_id`	BIGINT	NULL,
                                         `analysis_timestamp`	DECIMAL(10, 3)	NOT NULL	COMMENT '세션 시작 기준 시간(초)',
                                         `audio_analysis`	JSON	NULL	COMMENT '음성 감정 분석 결과',
                                         `video_analysis`	JSON	NULL	COMMENT '영상 감정 분석 결과',
                                         `combined_analysis`	JSON	NULL	COMMENT '종합 감정 분석 결과',
                                         `dominant_emotion`	VARCHAR(50)	NULL,
                                         `emotion_intensity`	DECIMAL(3, 1)	NULL	COMMENT '감정 강도',
                                         `authenticity_score`	DECIMAL(3, 2)	NULL	COMMENT '진정성 점수',
                                         `created_at`	DATETIME	NULL
);

CREATE TABLE `users` (
                         `mno`	BIGINT	NULL,
                         `user_id`	VARCHAR(50)	NOT NULL	COMMENT '사용자 아이디',
                         `name`	VARCHAR(50)	NOT NULL	COMMENT '이름',
                         `email`	VARCHAR(100)	NOT NULL	COMMENT '이메일',
                         `password`	VARCHAR(255)	NOT NULL	COMMENT '암호화된 비밀번호',
                         `address`	VARCHAR(500)	NULL	COMMENT '주소',
                         `age`	INT	NULL	COMMENT '나이',
                         `gender`	ENUM('남자', '여자', '상관없음')	NULL,
                         `role`	ENUM('USER', 'ADMIN')	NULL	DEFAULT 'USER',
                         `email_verified`	BOOLEAN	NULL	DEFAULT FALSE	COMMENT '이메일 인증 여부',
                         `is_active`	BOOLEAN	NULL	DEFAULT TRUE	COMMENT '계정 활성화 여부',
                         `created_at`	DATETIME	NULL,
                         `updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP,
                         `deleted_at`	DATETIME	NULL	COMMENT '탈퇴일시',
                         `profile_image`	VARCHAR(255)	NULL
);

CREATE TABLE `community_posts` (
                                   `id`	BIGINT	NULL,
                                   `user_id`	BIGINT	NOT NULL,
                                   `category`	ENUM('conflict_sharing', 'success_stories', 'advice_request', 'general')	NOT NULL,
                                   `title`	VARCHAR(200)	NOT NULL,
                                   `content`	TEXT	NOT NULL,
                                   `like_count`	INT	NULL	DEFAULT 0	COMMENT '좋아요 수',
                                   `dislike_count`	INT	NULL	DEFAULT FALSE	COMMENT '투표 기능 활성화',
                                   `tags`	JSON	NULL	COMMENT '태그 배열',
                                   `view_count`	INT	NULL	DEFAULT 0	COMMENT '조회수',
                                   `comment_count`	INT	NULL	DEFAULT 0	COMMENT '댓글 수',
                                   `is_deleted`	BOOLEAN	NULL,
                                   `created_at`	DATETIME	NULL,
                                   `updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `comments` (
                            `id`	BIGINT	NULL,
                            `post_id`	BIGINT	NOT NULL,
                            `user_id`	BIGINT	NOT NULL,
                            `parent_comment_id`	BIGINT	NULL	COMMENT '부모 댓글 ID (대댓글)',
                            `content`	TEXT	NOT NULL,
                            `like_count`	INT	NULL,
                            `dislike_count`	INT	NULL,
                            `is_deleted`	BOOLEAN	NULL,
                            `created_at`	DATETIME	NULL,
                            `updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `ai_analysis_results` (
                                       `id`	VARCHAR(50)	NULL,
                                       `user_id`	VARCHAR(50)	NOT NULL,
                                       `emotion_analysis`	TEXT	NULL,
                                       `conflict_analysis`	TEXT	NULL,
                                       `relationship_health_score`	INT	NULL,
                                       `trust_score`	JSON	NULL,
                                       `communication_score`	ENUM	NULL,
                                       `cooperation_score`	JSON	NULL,
                                       `created_at`	TIMESTAMP	NULL
);

CREATE TABLE `user_sessions` (
                                 `id`	BIGINT	NULL,
                                 `session_id`	VARCHAR(255)	NOT NULL	COMMENT '세션 ID',
                                 `user_id`	BIGINT	NOT NULL,
                                 `expires_at`	DATETIME	NOT NULL,
                                 `last_activity`	DATETIME	NULL,
                                 `is_active`	BOOLEAN	NULL,
                                 `created_at`	DATETIME	NULL
);

CREATE TABLE `email_verifications` (
                                       `id`	BIGINT	NULL,
                                       `email`	VARCHAR(100)	NOT NULL,
                                       `verification_code`	VARCHAR(10)	NOT NULL	COMMENT '인증번호',
                                       `expires_at`	DATETIME	NOT NULL	COMMENT '만료시간',
                                       `verified`	BOOLEAN	NULL,
                                       `created_at`	DATETIME	NULL
);

CREATE TABLE `chat_message` (
                                `id`	BIGINT	NULL,
                                `chat_room_id`	BIGINT	NOT NULL,
                                `sender`	ENUM('USER', 'BOT')	NOT NULL,
                                `message`	TEXT	NOT NULL,
                                `created_at`	DATETIME	NULL
);

CREATE TABLE `stt_transcripts` (
                                   `id`	BIGINT	NULL,
                                   `session_id`	BIGINT	NOT NULL,
                                   `user_id`	BIGINT	NULL,
                                   `speaker_name`	VARCHAR(50)	NOT NULL	COMMENT '발화자 이름',
                                   `text`	TEXT	NOT NULL	COMMENT '변환된 텍스트',
                                   `confidence`	DECIMAL(3, 2)	NULL	COMMENT 'STT 신뢰도',
                                   `start_time`	DECIMAL(10, 3)	NOT NULL	COMMENT '시작 시간(초)',
                                   `end_time`	DECIMAL(10, 3)	NOT NULL	COMMENT '종료 시간(초)',
                                   `words_detail`	JSON	NULL	COMMENT '단어별 상세 정보',
                                   `created_at`	DATETIME	NULL
);

CREATE TABLE `ai_interventions` (
                                    `id`	BIGINT	NULL,
                                    `session_id`	BIGINT	NOT NULL,
                                    `intervention_timestamp`	DECIMAL(10, 3)	NOT NULL	COMMENT '중재 시점(초)',
                                    `trigger_type`	ENUM('automatic_emotion_threshold', 'manual_request', 'pattern_detected', 'escalation_risk')	NOT NULL,
                                    `intervention_type`	ENUM('de_escalation', 'emotional_validation', 'structured_dialogue', 'break_suggestion')	NOT NULL,
                                    `emotional_context`	JSON	NULL	COMMENT '중재 시점 감정 상황',
                                    `conversation_context`	JSON	NULL	COMMENT '대화 맥락',
                                    `ai_message`	TEXT	NULL	COMMENT 'AI 중재 메시지',
                                    `suggested_actions`	JSON	NULL	COMMENT '제안된 행동',
                                    `follow_up_questions`	JSON	NULL	COMMENT '후속 질문',
                                    `effectiveness_score`	DECIMAL(3, 1)	NULL	COMMENT '중재 효과성 점수',
                                    `user_feedback`	JSON	NULL	COMMENT '사용자 피드백',
                                    `created_at`	DATETIME	NULL
);

CREATE TABLE `session_summaries` (
                                     `id`	BIGINT	NULL,
                                     `session_id`	BIGINT	NOT NULL,
                                     `duration_seconds`	INT	NOT NULL	COMMENT '총 세션 시간',
                                     `total_words`	INT	NULL	COMMENT '총 발화 단어 수',
                                     `speaking_ratio`	JSON	NULL	COMMENT '발화 비율',
                                     `topic_progression`	JSON	NULL	COMMENT '주제 진행 과정',
                                     `emotional_timeline`	JSON	NULL	COMMENT '감정 변화 타임라인',
                                     `key_moments`	JSON	NULL	COMMENT '주요 순간들',
                                     `critical_moments`	JSON	NULL	COMMENT '중요 전환점',
                                     `intervention_count`	INT	NULL	DEFAULT 0	COMMENT 'AI 중재 횟수',
                                     `resolution_outcome`	JSON	NULL	COMMENT '해결 결과',
                                     `agreed_actions`	JSON	NULL	COMMENT '합의된 행동',
                                     `follow_up_date`	DATE	NULL	COMMENT '후속 미팅 일정',
                                     `ai_analysis`	JSON	NULL	COMMENT 'AI 종합 분석',
                                     `success_factors`	JSON	NULL	COMMENT '성공 요인',
                                     `improvement_areas`	JSON	NULL	COMMENT '개선 영역',
                                     `participant_satisfaction`	JSON	NULL	COMMENT '참여자 만족도',
                                     `created_at`	DATETIME	NULL
);

CREATE TABLE `chat_room` (
                             `id`	BIGINT	NULL,
                             `user_id`	BIGINT	NOT NULL,
                             `title`	VARCHAR(255)	NULL,
                             `created_at`	DATETIME	NULL,
                             `updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `conflicts` (
                             `id`	BIGINT	NULL,
                             `user_id`	BIGINT	NOT NULL,
                             `title`	VARCHAR(200)	NOT NULL,
                             `description`	TEXT	NOT NULL,
                             `conflict_type`	ENUM('직장', '가족', '친구', '연인', '이웃', '금전', '온라인', '기타')	NOT NULL,
                             `conflict_when`	INT	NOT NULL,
                             `conflict_ frequency`	INT	NULL	COMMENT '갈등 발생 장소',
                             `participants`	JSON	NULL	COMMENT '갈등 참여자 정보',
                             `desired_outcome`	TEXT	NULL	COMMENT '원하는 결과',
                             `priority`	ENUM('상관없음','relationship', 'solution', 'self', 'prevention')	NULL,
                             `talk_willingness`	ENUM('노상관','yes', 'maybe', 'no')	NULL	DEFAULT 'maybe',
                             `Field`	ENUM('화남',슬픔','지침')	NULL,
	`intensity`	INT	NOT NULL	COMMENT '갈등 강도 1-10',
	`created_at`	DATETIME	NULL,
	`updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `notices` (
	`id`	BIGINT	NULL,
	`user_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(200)	NOT NULL,
	`content`	TEXT	NOT NULL,
	`category`	ENUM('system', 'update', 'maintenance', 'announcement')	NULL	DEFAULT 'announcement',
	`is_important`	BOOLEAN	NULL	DEFAULT FALSE	COMMENT '중요 공지',
	`is_popup`	BOOLEAN	NULL	DEFAULT FALSE	COMMENT '팝업 노출',
	`view_count`	INT	NULL,
	`publish_date`	DATETIME	NULL	COMMENT '게시 일시',
	`expire_date`	DATETIME	NULL	COMMENT '만료 일시',
	`is_active`	BOOLEAN	NULL,
	`created_at`	DATETIME	NULL,
	`updated_at`	DATETIME	NULL	DEFAULT CURRENT_TIMESTAMP
);

