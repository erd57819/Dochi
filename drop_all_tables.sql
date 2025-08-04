-- =================================================================================
-- 모든 테이블 삭제 (외래키 순서에 맞춰서)
-- =================================================================================

-- 외래키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 모든 테이블 삭제
DROP TABLE IF EXISTS `final_analysis_reports`;
DROP TABLE IF EXISTS `session_summaries`;
DROP TABLE IF EXISTS `ai_interventions`;
DROP TABLE IF EXISTS `stt_transcripts`;
DROP TABLE IF EXISTS `emotion_analysis_logs`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `ai_analysis_results`;
DROP TABLE IF EXISTS `user_conflicts`;
DROP TABLE IF EXISTS `video_call_sessions`;
DROP TABLE IF EXISTS `video_call_rooms`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_rooms`;
DROP TABLE IF EXISTS `notices`;
DROP TABLE IF EXISTS `comment_likes`;
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `community_posts`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `email_verification`;
DROP TABLE IF EXISTS `users`;

-- 외래키 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 확인용 (테이블 목록 조회)
SHOW TABLES;
