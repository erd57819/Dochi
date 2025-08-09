import openai
from core.config import settings
from typing import Dict, List
import json
from datetime import datetime

# OpenAI 클라이언트 설정
client = openai.OpenAI(
    api_key=settings.GMS_KEY,
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

def generate_action_plan(data: Dict, redis_client) -> Dict:
    """
    화자별 맞춤형 액션 플랜을 생성합니다.
    
    Args:
        data: {
            "roomId": str,
            "speaker": str,
            "text": str,
            "timestamp": str
        }
        redis_client: Redis 클라이언트
        
    Returns:
        Dict: 액션 플랜 결과
    """
    try:
        room_id = data.get("roomId")
        speaker = data.get("speaker")
        text = data.get("text")
        
        # 해당 방의 전체 대화 컨텍스트 가져오기
        context = get_conversation_context(room_id, redis_client)
        
        # GPT를 사용한 액션 플랜 생성
        action_plan = generate_speaker_action_plan(speaker, text, context)
        
        # Redis에 저장
        plan_key = f"action_plan:{room_id}:{speaker}"
        redis_client.set(plan_key, json.dumps(action_plan), ex=86400)  # 24시간 TTL
        
        # 액션 플랜 히스토리에 추가
        history_key = f"action_plan:history:{room_id}:{speaker}"
        redis_client.rpush(history_key, json.dumps({
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
            "plan": action_plan["immediate_actions"][0] if action_plan.get("immediate_actions") else "플랜 없음"
        }))
        
        print(f"[액션 플랜 생성] {plan_key}")
        return action_plan
        
    except Exception as e:
        print(f"[액션 플랜 생성 오류] {e}")
        return generate_default_action_plan(speaker)


def generate_speaker_action_plan(speaker: str, current_text: str, context: str) -> Dict:
    """
    특정 화자를 위한 맞춤형 액션 플랜을 생성합니다.
    
    Args:
        speaker: 화자 이름
        current_text: 현재 발언 내용
        context: 전체 대화 맥락
        
    Returns:
        Dict: 맞춤형 액션 플랜
    """
    try:
        prompt = f"""
당신은 갈등 중재 전문가입니다. 다음 대화를 분석하여 '{speaker}'를 위한 구체적인 액션 플랜을 제공해주세요.

현재 발언: {speaker}: {current_text}

대화 맥락:
{context}

다음 형식의 JSON으로 응답해주세요:

{{
  "speaker": "{speaker}",
  "situation_analysis": "현재 상황 분석 (2-3문장)",
  "emotional_state": {{
    "current": "현재 감정 상태",
    "triggers": ["감정 유발 요인들"],
    "recommended_state": "권장 감정 상태"
  }},
  "immediate_actions": [
    {{
      "action": "즉시 실행할 행동",
      "purpose": "목적",
      "example": "구체적 예시 문장"
    }}
  ],
  "communication_strategies": [
    {{
      "strategy": "의사소통 전략",
      "technique": "구체적 기법",
      "sample_phrase": "예시 표현"
    }}
  ],
  "short_term_goals": [
    {{
      "goal": "단기 목표 (1-2주)",
      "steps": ["실행 단계1", "실행 단계2"],
      "success_metrics": "성공 지표"
    }}
  ],
  "long_term_recommendations": [
    {{
      "recommendation": "장기 권장사항 (1-3개월)",
      "rationale": "이유",
      "expected_outcome": "기대 효과"
    }}
  ],
  "conflict_resolution_tips": [
    "갈등 해결 팁1",
    "갈등 해결 팁2",
    "갈등 해결 팁3"
  ],
  "self_reflection_questions": [
    "스스로에게 물어볼 질문1",
    "스스로에게 물어볼 질문2"
  ],
  "priority": "HIGH|MEDIUM|LOW",
  "urgency_score": 1-10 (숫자)
}}

분석 시 고려사항:
1. 화자의 현재 감정 상태와 니즈 파악
2. 실현 가능하고 구체적인 행동 제안
3. 상대방의 입장도 고려한 균형잡힌 조언
4. 긍정적이고 건설적인 방향 제시
5. 문화적 맥락을 고려한 한국적 상황에 맞는 조언

응답은 반드시 유효한 JSON 형식으로만 제공해주세요.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # JSON 파싱
        try:
            action_plan = json.loads(result_text)
        except json.JSONDecodeError:
            # 파싱 실패 시 기본 플랜 반환
            action_plan = generate_default_action_plan(speaker)
            action_plan["error"] = "JSON 파싱 실패"
        
        return action_plan
        
    except Exception as e:
        print(f"[액션 플랜 GPT 오류] {e}")
        default_plan = generate_default_action_plan(speaker)
        default_plan["error"] = str(e)
        return default_plan


def generate_default_action_plan(speaker: str) -> Dict:
    """
    기본 액션 플랜을 생성합니다 (오류 발생 시 대체용).
    
    Args:
        speaker: 화자 이름
        
    Returns:
        Dict: 기본 액션 플랜
    """
    return {
        "speaker": speaker,
        "situation_analysis": "대화 분석이 필요합니다. 상대방의 입장을 이해하려 노력해보세요.",
        "emotional_state": {
            "current": "분석 중",
            "triggers": ["갈등 상황"],
            "recommended_state": "차분함"
        },
        "immediate_actions": [
            {
                "action": "잠시 심호흡하고 감정 진정시키기",
                "purpose": "감정 조절",
                "example": "지금 잠시 멈추고 3번 깊게 숨을 쉬어보세요."
            },
            {
                "action": "상대방의 말을 끝까지 듣기",
                "purpose": "경청",
                "example": "네, 당신의 말을 듣고 있어요. 계속 말씀해주세요."
            }
        ],
        "communication_strategies": [
            {
                "strategy": "나-전달법 사용",
                "technique": "자신의 감정을 '나'를 주어로 표현",
                "sample_phrase": "나는 ~할 때 ~한 감정을 느꼈어요."
            }
        ],
        "short_term_goals": [
            {
                "goal": "대화 분위기 개선",
                "steps": ["감정 인정하기", "공통점 찾기"],
                "success_metrics": "서로 대화를 계속할 의지가 있음"
            }
        ],
        "long_term_recommendations": [
            {
                "recommendation": "정기적인 대화 시간 갖기",
                "rationale": "소통 부재 예방",
                "expected_outcome": "관계 개선"
            }
        ],
        "conflict_resolution_tips": [
            "비난보다는 자신의 니즈 표현하기",
            "win-win 해결책 모색하기",
            "필요시 중재자 도움 받기"
        ],
        "self_reflection_questions": [
            "내가 정말 원하는 것은 무엇인가?",
            "상대방의 입장에서 생각해보면 어떨까?"
        ],
        "priority": "MEDIUM",
        "urgency_score": 5
    }


def get_conversation_context(room_id: str, redis_client, max_lines: int = 20) -> str:
    """
    대화 맥락을 가져옵니다.
    
    Args:
        room_id: 방 ID
        redis_client: Redis 클라이언트
        max_lines: 최대 라인 수
        
    Returns:
        str: 대화 맥락 텍스트
    """
    try:
        # 여러 청크에서 대화 내용 수집
        context_lines = []
        
        # 최근 10개 청크 확인
        for chunk_index in range(10):
            key = f"stt:transcript:{room_id}:{chunk_index}"
            lines = redis_client.lrange(key, 0, -1)
            if lines:
                context_lines.extend(lines[-max_lines:])
        
        # 전체 스크립트에서도 가져오기
        raw_key = f"stt:raw:{room_id}"
        raw_lines = redis_client.lrange(raw_key, -max_lines, -1)
        if raw_lines:
            context_lines.extend(raw_lines)
        
        # 중복 제거하고 최신 순으로 정렬
        seen = set()
        unique_lines = []
        for line in reversed(context_lines):
            if line not in seen:
                seen.add(line)
                unique_lines.append(line)
        
        return "\n".join(unique_lines[:max_lines]) if unique_lines else "대화 맥락 없음"
        
    except Exception as e:
        print(f"[컨텍스트 가져오기 오류] {e}")
        return "대화 맥락을 가져올 수 없습니다"


def aggregate_action_plans(room_id: str, redis_client) -> Dict:
    """
    방의 모든 화자에 대한 액션 플랜을 집계합니다.
    
    Args:
        room_id: 방 ID
        redis_client: Redis 클라이언트
        
    Returns:
        Dict: 집계된 액션 플랜
    """
    try:
        # 모든 화자의 액션 플랜 수집
        pattern = f"action_plan:{room_id}:*"
        keys = redis_client.keys(pattern)
        
        all_plans = {}
        for key in keys:
            speaker = key.split(":")[-1]
            plan_data = redis_client.get(key)
            if plan_data:
                all_plans[speaker] = json.loads(plan_data)
        
        # 전체 요약 생성
        summary = {
            "room_id": room_id,
            "total_speakers": len(all_plans),
            "speakers": list(all_plans.keys()),
            "individual_plans": all_plans,
            "collective_recommendations": generate_collective_recommendations(all_plans),
            "priority_actions": extract_priority_actions(all_plans),
            "generated_at": datetime.now().isoformat()
        }
        
        return summary
        
    except Exception as e:
        print(f"[액션 플랜 집계 오류] {e}")
        return {
            "room_id": room_id,
            "error": str(e),
            "individual_plans": {},
            "generated_at": datetime.now().isoformat()
        }


def generate_collective_recommendations(all_plans: Dict) -> List[str]:
    """
    모든 화자를 위한 공통 권장사항을 생성합니다.
    
    Args:
        all_plans: 모든 화자의 액션 플랜
        
    Returns:
        List[str]: 공통 권장사항 리스트
    """
    recommendations = [
        "모든 참여자가 서로의 감정을 인정하고 존중하기",
        "대화 규칙 설정하기 (예: 한 번에 한 사람만 말하기)",
        "갈등의 근본 원인에 집중하기",
        "win-win 해결책을 함께 모색하기",
        "필요시 전문가의 도움 받기"
    ]
    
    # 우선순위가 높은 플랜이 많으면 긴급 권장사항 추가
    high_priority_count = sum(1 for plan in all_plans.values() 
                            if plan.get("priority") == "HIGH")
    
    if high_priority_count > len(all_plans) / 2:
        recommendations.insert(0, "⚠️ 즉각적인 갈등 중재가 필요합니다")
    
    return recommendations


def extract_priority_actions(all_plans: Dict) -> List[Dict]:
    """
    우선순위가 높은 액션들을 추출합니다.
    
    Args:
        all_plans: 모든 화자의 액션 플랜
        
    Returns:
        List[Dict]: 우선순위 액션 리스트
    """
    priority_actions = []
    
    for speaker, plan in all_plans.items():
        if plan.get("priority") == "HIGH" or plan.get("urgency_score", 0) >= 7:
            for action in plan.get("immediate_actions", [])[:1]:  # 가장 중요한 액션 1개
                priority_actions.append({
                    "speaker": speaker,
                    "action": action.get("action", ""),
                    "purpose": action.get("purpose", ""),
                    "urgency": plan.get("urgency_score", 5)
                })
    
    # 긴급도 순으로 정렬
    priority_actions.sort(key=lambda x: x.get("urgency", 0), reverse=True)
    
    return priority_actions[:5]  # 상위 5개만 반환