# routers/partitionRouter.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.kafkaPartitionService import (
    partition_manager, 
    produce_with_partitioning, 
    get_kafka_partition_stats,
    init_partition_kafka,
    start_partitioned_consumers
)
from typing import Dict, Any
import json

router = APIRouter(prefix="/partition", tags=["Kafka Partitioning"])

class PartitionMessageRequest(BaseModel):
    topic: str
    room_id: str
    message: str

class PartitionTestRequest(BaseModel):
    room_id: str
    participant_name: str
    emotion_data: Dict[str, Any]

@router.post("/init")
def initialize_partition_system():
    """파티션 시스템 초기화"""
    try:
        init_partition_kafka()
        return {"status": "success", "message": "Partition system initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize partition system: {str(e)}")

@router.post("/send")
def send_partitioned_message(request: PartitionMessageRequest):
    """파티셔닝을 사용해 메시지 전송"""
    try:
        produce_with_partitioning(request.topic, request.room_id, request.message)
        partition = partition_manager.get_partition_for_room(request.room_id)
        
        return {
            "status": "success",
            "room_id": request.room_id,
            "assigned_partition": partition,
            "message": "Message sent to partitioned topic"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@router.post("/test/emotion")
def test_emotion_partitioning(request: PartitionTestRequest):
    """감정 데이터 파티셔닝 테스트"""
    try:
        # 감정 데이터를 JSON으로 변환
        emotion_message = json.dumps({
            "room_id": request.room_id,
            "participant": request.participant_name,
            "emotions": request.emotion_data,
            "timestamp": "2025-01-17T12:00:00Z"
        })
        
        # 파티셔닝으로 전송
        produce_with_partitioning("emotion", request.room_id, emotion_message)
        partition = partition_manager.get_partition_for_room(request.room_id)
        
        return {
            "status": "success",
            "room_id": request.room_id,
            "partition": partition,
            "message": "Emotion data sent to partition",
            "data": request.emotion_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test emotion partitioning: {str(e)}")

@router.get("/stats")
def get_partition_statistics():
    """파티션별 통계 조회"""
    try:
        stats = get_kafka_partition_stats()
        rebalance_info = partition_manager.rebalance_partitions()
        
        return {
            "status": "success",
            "total_partitions": partition_manager.num_partitions,
            "partition_stats": stats,
            "rebalance_info": rebalance_info,
            "system_health": _calculate_system_health(stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get partition stats: {str(e)}")

@router.get("/room/{room_id}/partition")
def get_room_partition(room_id: str):
    """특정 방의 파티션 정보 조회"""
    try:
        partition = partition_manager.get_partition_for_room(room_id)
        
        return {
            "room_id": room_id,
            "assigned_partition": partition,
            "total_partitions": partition_manager.num_partitions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get room partition: {str(e)}")

@router.post("/consumers/start/{topic}")
def start_topic_consumers(topic: str):
    """특정 토픽의 파티션 Consumer 시작"""
    try:
        # 더미 메시지 핸들러 (실제로는 기존 Consumer 로직 사용)
        def dummy_handler(message: str):
            print(f"[Partition Consumer] Received: {message}")
            
        start_partitioned_consumers(topic, dummy_handler)
        
        return {
            "status": "success",
            "topic": f"{topic}_partitioned",
            "consumers_started": partition_manager.num_partitions,
            "message": f"Started {partition_manager.num_partitions} consumers for {topic}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start consumers: {str(e)}")

@router.post("/consumers/stop")
def stop_all_consumers():
    """모든 파티션 Consumer 중지"""
    try:
        partition_manager.stop_partition_consumers()
        return {"status": "success", "message": "All partition consumers stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop consumers: {str(e)}")

@router.get("/health")
def partition_system_health():
    """파티션 시스템 상태 확인"""
    try:
        stats = get_kafka_partition_stats()
        health_score = _calculate_system_health(stats)
        
        return {
            "status": "healthy" if health_score > 70 else "degraded",
            "health_score": health_score,
            "active_partitions": len([p for p in stats.values() if p["active_rooms"] > 0]),
            "total_partitions": partition_manager.num_partitions,
            "total_active_rooms": sum(p["active_rooms"] for p in stats.values()),
            "is_running": partition_manager.is_running
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "health_score": 0
        }

def _calculate_system_health(stats: Dict) -> int:
    """시스템 건강도 계산 (0-100)"""
    if not stats:
        return 0
        
    # 활성 파티션 비율
    active_partitions = len([p for p in stats.values() if p["active_rooms"] > 0])
    partition_ratio = (active_partitions / len(stats)) * 100
    
    # 부하 분산 정도 (편차가 작을수록 높은 점수)
    room_counts = [p["active_rooms"] for p in stats.values()]
    if max(room_counts) > 0:
        load_balance = (1 - (max(room_counts) - min(room_counts)) / max(max(room_counts), 1)) * 100
    else:
        load_balance = 100
        
    # 전체 건강도 (파티션 활용도 60% + 부하 분산 40%)
    health_score = int(partition_ratio * 0.6 + load_balance * 0.4)
    return min(100, max(0, health_score))