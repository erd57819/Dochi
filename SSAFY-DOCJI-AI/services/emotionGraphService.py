import json
from datetime import datetime
from typing import Dict, List

def update_emotion_graph(data: Dict, redis_client):
    """
    표정 감정 데이터를 받아서 시간대별 감정 변화 그래프 데이터를 생성합니다.
    
    Args:
        data: {
            "roomId": str,
            "speaker": str, 
            "timestamp": str,
            "emotions": {
                "dominant": str,  # 주요 감정
                "frequency": int,  # 빈도수
                "all": Dict[str, int]  # 모든 감정별 카운트
            }
        }
        redis_client: Redis 클라이언트
    """
    try:
        room_id = data["roomId"]
        speaker = data["speaker"]
        timestamp = data["timestamp"]
        emotions = data["emotions"]
        
        # 타임스탬프를 datetime 객체로 변환
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # 5분 단위 시간 구간 계산
        minute_block = (dt.minute // 5) * 5
        time_key = f"{dt.hour:02d}:{minute_block:02d}"
        
        # Redis 키 생성: emotion:graph:{room_id}:{speaker}:{time_key}
        redis_key = f"emotion:graph:{room_id}:{speaker}:{time_key}"
        
        # 감정 데이터 저장
        emotion_data = {
            "timestamp": timestamp,
            "dominant_emotion": emotions.get("dominant", "neutral"),
            "frequency": emotions.get("frequency", 0),
            "all_emotions": emotions.get("all", {}),
            "time_block": time_key
        }
        
        # Redis에 JSON으로 저장
        redis_client.set(redis_key, json.dumps(emotion_data), ex=86400)  # 24시간 TTL
        
        # 전체 세션의 감정 추이를 위한 리스트에도 추가
        session_key = f"emotion:session:{room_id}:{speaker}"
        redis_client.rpush(session_key, json.dumps({
            "time": time_key,
            "emotion": emotions.get("dominant", "neutral"),
            "score": calculate_emotion_score(emotions.get("all", {}))
        }))
        
        # 감정 변화 그래프용 집계 데이터 업데이트
        update_emotion_summary(room_id, speaker, emotions, redis_client)
        
        print(f"[감정 그래프 업데이트] {redis_key} → {emotion_data}")
        
    except Exception as e:
        print(f"[감정 그래프 오류] {e}")
        raise


def calculate_emotion_score(emotions: Dict[str, int]) -> float:
    """
    감정 점수를 계산합니다. (긍정: +값, 부정: -값)
    
    Args:
        emotions: 감정별 카운트 딕셔너리
        
    Returns:
        float: -1.0 ~ 1.0 사이의 감정 점수
    """
    positive_emotions = ["happy", "surprised", "neutral"]
    negative_emotions = ["angry", "sad", "fear", "disgusted"]
    
    total_count = sum(emotions.values()) if emotions else 1
    positive_count = sum(emotions.get(e, 0) for e in positive_emotions)
    negative_count = sum(emotions.get(e, 0) for e in negative_emotions)
    
    if total_count == 0:
        return 0.0
        
    score = (positive_count - negative_count) / total_count
    return max(-1.0, min(1.0, score))  # -1.0 ~ 1.0 범위로 제한


def update_emotion_summary(room_id: str, speaker: str, emotions: Dict, redis_client):
    """
    감정 요약 정보를 업데이트합니다.
    
    Args:
        room_id: 방 ID
        speaker: 화자 ID
        emotions: 감정 데이터
        redis_client: Redis 클라이언트
    """
    summary_key = f"emotion:summary:{room_id}:{speaker}"
    
    # 기존 요약 데이터 가져오기
    existing_data = redis_client.get(summary_key)
    if existing_data:
        summary = json.loads(existing_data)
    else:
        summary = {
            "total_samples": 0,
            "emotion_counts": {},
            "dominant_emotion": None,
            "emotion_changes": [],
            "average_score": 0.0
        }
    
    # 업데이트
    summary["total_samples"] += 1
    
    # 감정별 카운트 업데이트
    all_emotions = emotions.get("all", {})
    for emotion, count in all_emotions.items():
        summary["emotion_counts"][emotion] = summary["emotion_counts"].get(emotion, 0) + count
    
    # 주요 감정 재계산
    if summary["emotion_counts"]:
        summary["dominant_emotion"] = max(summary["emotion_counts"], key=summary["emotion_counts"].get)
    
    # 감정 변화 추적 (최근 10개만 유지)
    summary["emotion_changes"].append({
        "timestamp": datetime.now().isoformat(),
        "emotion": emotions.get("dominant", "neutral")
    })
    summary["emotion_changes"] = summary["emotion_changes"][-10:]
    
    # 평균 감정 점수 재계산
    score = calculate_emotion_score(all_emotions)
    summary["average_score"] = (
        (summary["average_score"] * (summary["total_samples"] - 1) + score) 
        / summary["total_samples"]
    )
    
    # Redis에 저장
    redis_client.set(summary_key, json.dumps(summary), ex=86400)  # 24시간 TTL


def get_emotion_graph_data(room_id: str, speaker: str, redis_client) -> Dict:
    """
    특정 화자의 감정 변화 그래프 데이터를 반환합니다.
    
    Args:
        room_id: 방 ID
        speaker: 화자 ID
        redis_client: Redis 클라이언트
        
    Returns:
        Dict: 그래프 렌더링용 데이터
    """
    session_key = f"emotion:session:{room_id}:{speaker}"
    summary_key = f"emotion:summary:{room_id}:{speaker}"
    
    # 세션 데이터 가져오기
    session_data = redis_client.lrange(session_key, 0, -1)
    emotion_timeline = [json.loads(item) for item in session_data]
    
    # 요약 데이터 가져오기
    summary_data = redis_client.get(summary_key)
    summary = json.loads(summary_data) if summary_data else {}
    
    return {
        "speaker": speaker,
        "timeline": emotion_timeline,
        "summary": summary,
        "graph_data": {
            "labels": [item["time"] for item in emotion_timeline],
            "scores": [item["score"] for item in emotion_timeline],
            "emotions": [item["emotion"] for item in emotion_timeline]
        }
    }