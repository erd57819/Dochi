-- =================================================================================
-- chat_rooms 테이블에 session_id 컬럼 안전 추가 마이그레이션 스크립트
-- 실행일: 2024년
-- 목적: 기존 운영 중인 데이터베이스에 session_id 컬럼을 안전하게 추가
-- =================================================================================

-- 데이터베이스 사용
USE dochi;

-- 1단계: 기존 데이터에 오류가 나지 않도록 UNIQUE 제약조건만으로 컬럼을 추가합니다.
ALTER TABLE chat_rooms ADD COLUMN session_id VARCHAR(255) UNIQUE;

-- 2단계: 기존에 있던 모든 채팅방에 고유한 session_id 값을 생성하여 채워줍니다.
-- CONCAT 함수와 UUID() 함수를 사용하여 'session_' 접두사가 붙은 고유 ID를 만듭니다.
UPDATE chat_rooms
SET session_id = CONCAT('session_', UUID())
WHERE session_id IS NULL;

-- 3단계: 모든 데이터에 값이 채워졌으므로, 앞으로는 NULL을 허용하지 않도록 제약조건을 추가합니다.
ALTER TABLE chat_rooms
MODIFY COLUMN session_id VARCHAR(255) NOT NULL;

-- =================================================================================
-- 마이그레이션 완료 확인
-- =================================================================================

-- chat_rooms 테이블 구조 확인
DESCRIBE chat_rooms;

-- session_id 컬럼이 모든 행에 올바르게 생성되었는지 확인
SELECT 
    COUNT(*) as total_rooms,
    COUNT(session_id) as rooms_with_session_id,
    COUNT(DISTINCT session_id) as unique_session_ids
FROM chat_rooms;

-- 샘플 데이터 확인
SELECT id, user_id, title, session_id, created_at 
FROM chat_rooms 
LIMIT 5;

SELECT 'Migration completed successfully! session_id column added to chat_rooms table.' as message;