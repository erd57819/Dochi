import requests
import json
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
from services.emotionService import EmotionService

load_dotenv()

class CoachingService:
    def __init__(self):
        """GMS Claude API를 사용한 대화 코칭 서비스 초기화"""
        self.gms_url = "https://gms.ssafy.io/gmsapi/api.anthropic.com/v1/messages"
        self.gms_key = os.getenv('GMS_KEY', '')
        self.model = "claude-3-5-haiku-latest"
        self.emotion_service = EmotionService()
        
        if not self.gms_key:
            print("⚠️  GMS_KEY 환경변수가 설정되지 않았습니다.")
    
    def analyze_emotion_pattern(self, recent_emotions: List[str], silence_duration: float = 0) -> Dict:
        """
        최근 감정 패턴을 분석하여 코칭 필요성을 판단합니다.
        
        Args:
            recent_emotions: 최근 3-5개의 감정 리스트 ['frustrated', 'angry', 'concerned', ...]
            silence_duration: 마지막 발언 후 경과 시간 (초)
            
        Returns:
            dict: 코칭 트리거 정보
        """
        if not recent_emotions:
            return {"trigger": False, "type": None, "urgency": "low"}
        
        latest_emotion = recent_emotions[-1] if recent_emotions else "neutral"
        
        # 0. 침묵 기반 트리거 체크 (최우선)
        if silence_duration > 0:
            silence_trigger = self._check_silence_triggers(recent_emotions, silence_duration)
            if silence_trigger["trigger"]:
                return silence_trigger
        
        # 1. 즉시 개입 필요 (강한 부정 감정)
        if latest_emotion == 'angry':
            return {
                "trigger": True, 
                "type": "immediate", 
                "urgency": "high",
                "reason": "강한 분노 감정 감지"
            }
        
        # 2. 연속된 부정 감정 패턴
        negative_emotions = ['frustrated', 'concerned', 'sad', 'angry']
        recent_negative = [e for e in recent_emotions[-3:] if e in negative_emotions]
        
        if len(recent_negative) >= 2:
            return {
                "trigger": True,
                "type": "pattern",
                "urgency": "medium", 
                "reason": f"연속된 부정 감정: {recent_negative}"
            }
        
        # 3. 감정 악화 패턴 (neutral → concerned → frustrated)
        if len(recent_emotions) >= 3:
            progression_patterns = [
                ['neutral', 'concerned', 'frustrated'],
                ['neutral', 'frustrated', 'angry'],
                ['concerned', 'frustrated', 'angry']
            ]
            
            for pattern in progression_patterns:
                if recent_emotions[-3:] == pattern:
                    return {
                        "trigger": True,
                        "type": "escalation",
                        "urgency": "high",
                        "reason": f"감정 악화 패턴: {' → '.join(pattern)}"
                    }
        
        return {"trigger": False, "type": None, "urgency": "low"}
    
    def _check_silence_triggers(self, recent_emotions: List[str], silence_duration: float) -> Dict:
        """
        침묵 기반 트리거를 체크합니다.
        
        Args:
            recent_emotions: 최근 감정 리스트
            silence_duration: 침묵 시간 (초)
            
        Returns:
            dict: 침묵 트리거 정보
        """
        latest_emotion = recent_emotions[-1] if recent_emotions else "neutral"
        negative_emotions = ['frustrated', 'concerned', 'sad', 'angry']
        
        # 트리거 4: 침묵 후 부정 감정 (15초 이상 침묵 후 부정적 발언)
        if silence_duration >= 15 and latest_emotion in negative_emotions:
            return {
                "trigger": True,
                "type": "silence-negative",
                "urgency": "high",
                "reason": f"{silence_duration:.0f}초 침묵 후 {latest_emotion} 감정으로 재개"
            }
        
        # 트리거 5: 장시간 침묵 (30초 이상 대화 중단)
        if silence_duration >= 30:
            return {
                "trigger": True,
                "type": "long-silence", 
                "urgency": "medium",
                "reason": f"{silence_duration:.0f}초간 대화 중단"
            }
        
        # 트리거 6: 중간 침묵 후 재개 (20초 이상 침묵 후 재개)
        if silence_duration >= 20:
            return {
                "trigger": True,
                "type": "silence-resume",
                "urgency": "low", 
                "reason": f"{silence_duration:.0f}초 침묵 후 대화 재개"
            }
            
        return {"trigger": False, "type": None, "urgency": "low"}
    
    def analyze_and_coach(self, conversation_context: List[Dict], silence_duration: float = 0) -> Dict:
        """
        대화 내용을 감정 분석하고 코칭이 필요한지 판단한 후 메시지 생성합니다.
        
        Args:
            conversation_context: 최근 대화 내용 [{"speaker": "A", "text": "..."}, ...]
            silence_duration: 침묵 시간 (초)
            
        Returns:
            dict: 코칭 결과 전체 정보
        """
        try:
            # 1. 각 발언에 대해 Google API 감정 분석
            emotions = []
            conversation_with_emotions = []
            
            for conv in conversation_context[-3:]:  # 최근 3개 발언만 분석
                single_conversation = [{"speaker": conv['speaker'], "text": conv['text']}]
                emotion_result = self.emotion_service.analyze_conversation_emotion(single_conversation)
                
                if emotion_result and not emotion_result.get('error'):
                    emotion = emotion_result.get('emotion', 'neutral')
                    score = emotion_result.get('score', 0)
                    magnitude = emotion_result.get('magnitude', 0)
                else:
                    emotion, score, magnitude = 'neutral', 0, 0
                
                emotions.append(emotion)
                conversation_with_emotions.append({
                    **conv,
                    'emotion': emotion,
                    'score': score,
                    'magnitude': magnitude
                })
                
                print(f"[Google 감정분석] {conv['speaker']}: {conv['text'][:30]}... → {emotion}({score})")
            
            # 2. 감정 패턴 분석으로 트리거 확인
            trigger_info = self.analyze_emotion_pattern(emotions, silence_duration)
            
            result = {
                "coachingNeeded": trigger_info["trigger"],
                "triggerType": trigger_info.get("type"),
                "urgency": trigger_info.get("urgency", "low"),
                "reason": trigger_info.get("reason", ""),
                "nextCheckInterval": self.get_coaching_interval(emotions),
                "emotions": emotions,
                "conversationWithEmotions": conversation_with_emotions
            }
            
            # 3. 코칭이 필요한 경우 Claude API로 메시지 생성
            if trigger_info["trigger"]:
                coaching_message = self.generate_coaching_message_with_emotions(
                    conversation_with_emotions, trigger_info
                )
                result["coachingMessage"] = coaching_message
            
            return result
            
        except Exception as e:
            print(f"코칭 분석 실패: {e}")
            return {
                "coachingNeeded": False,
                "error": str(e),
                "nextCheckInterval": 60
            }
    
    def generate_coaching_message_with_emotions(self, conversation_with_emotions: List[Dict], trigger_info: Dict) -> Optional[str]:
        """
        감정 정보가 포함된 대화 내용과 트리거 정보를 바탕으로 코칭 메시지를 생성합니다.
        """
        if not self.gms_key:
            return "⚠️ GMS API 키가 설정되지 않아 코칭 서비스를 사용할 수 없습니다."
        
        try:
            # 대화 내용과 감정 정보를 포함한 프롬프트 생성
            coaching_prompt = self._create_coaching_prompt_with_emotions(
                conversation_with_emotions, trigger_info
            )
            
            # GMS Claude API 호출
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.gms_key,
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": self.model,
                "max_tokens": 512,
                "messages": [
                    {
                        "role": "user", 
                        "content": coaching_prompt
                    }
                ]
            }
            
            response = requests.post(self.gms_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                coaching_message = result["content"][0]["text"]
                return coaching_message
            else:
                print(f"GMS API 오류: {response.status_code} - {response.text}")
                return "죄송합니다. 현재 코칭 서비스에 일시적인 문제가 있습니다."
                
        except requests.exceptions.Timeout:
            print("GMS API 타임아웃")
            return "코칭 서비스 응답이 지연되고 있습니다."
        except Exception as e:
            print(f"코칭 메시지 생성 실패: {e}")
            return None

    def generate_coaching_message(self, conversation_context: List[Dict], trigger_info: Dict) -> Optional[str]:
        """
        대화 내용과 트리거 정보를 바탕으로 코칭 메시지를 생성합니다.
        
        Args:
            conversation_context: 최근 대화 내용 [{"speaker": "A", "text": "...", "emotion": "frustrated"}, ...]
            trigger_info: 코칭 트리거 정보
            
        Returns:
            str: 생성된 코칭 메시지 또는 None
        """
        if not self.gms_key:
            return "⚠️ GMS API 키가 설정되지 않아 코칭 서비스를 사용할 수 없습니다."
        
        try:
            # 대화 컨텍스트 준비
            context_text = ""
            for conv in conversation_context[-5:]:  # 최근 5개 대화만 사용
                context_text += f"{conv['speaker']}: {conv['text']} [감정: {conv.get('emotion', 'unknown')}]\n"
            
            # 트리거 타입별 프롬프트 생성
            coaching_prompt = self._create_coaching_prompt(context_text, trigger_info)
            
            # GMS Claude API 호출
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.gms_key,
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": self.model,
                "max_tokens": 512,
                "messages": [
                    {
                        "role": "user", 
                        "content": coaching_prompt
                    }
                ]
            }
            
            response = requests.post(self.gms_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                coaching_message = result["content"][0]["text"]
                return coaching_message
            else:
                print(f"GMS API 오류: {response.status_code} - {response.text}")
                return "죄송합니다. 현재 코칭 서비스에 일시적인 문제가 있습니다."
                
        except requests.exceptions.Timeout:
            print("GMS API 타임아웃")
            return "코칭 서비스 응답이 지연되고 있습니다."
        except Exception as e:
            print(f"코칭 메시지 생성 실패: {e}")
            return None
    
    def _create_coaching_prompt(self, context_text: str, trigger_info: Dict) -> str:
        """트리거 타입별 코칭 프롬프트를 생성합니다."""
        
        base_instruction = """당신은 팀 내 갈등 해결을 돕는 전문 코치입니다. 
다음 대화 상황에서 건설적이고 실용적인 조언을 해주세요.
- 50자 이내로 간결하게 답변하세요
- 비난하지 말고 해결 방향을 제시하세요  
- 한국어 존댓말로 답변하세요"""
        
        trigger_specific = ""
        
        if trigger_info["type"] == "immediate":
            trigger_specific = """현재 강한 부정 감정이 감지되었습니다. 
즉시 상황을 진정시키고 대화를 건설적으로 이끌 수 있는 조언을 해주세요."""
            
        elif trigger_info["type"] == "pattern":
            trigger_specific = """연속된 부정적 감정 패턴이 감지되었습니다. 
근본적인 문제 해결을 위한 구체적인 방법을 제시해주세요."""
            
        elif trigger_info["type"] == "escalation":
            trigger_specific = """감정이 점점 악화되고 있습니다. 
갈등이 더 커지기 전에 중재할 수 있는 방법을 알려주세요."""
            
        elif trigger_info["type"] == "silence-negative":
            trigger_specific = """침묵 후 부정적인 감정으로 대화가 재개되었습니다.
갈등 상황을 완화하고 건설적인 대화로 이끌 수 있는 방법을 제시해주세요."""

        elif trigger_info["type"] == "long-silence":
            trigger_specific = """대화가 장시간 중단되었습니다.
소통을 다시 활성화하고 분위기를 개선할 수 있는 방법을 알려주세요."""

        elif trigger_info["type"] == "silence-resume":
            trigger_specific = """침묵 후 대화가 재개되었습니다.
원활한 소통을 위한 간단한 조언을 해주세요."""
        
        return f"""{base_instruction}

{trigger_specific}

대화 내용:
{context_text}

상황: {trigger_info.get('reason', '')}

코칭 조언:"""

    def _create_coaching_prompt_with_emotions(self, conversation_with_emotions: List[Dict], trigger_info: Dict) -> str:
        """감정 정보가 포함된 트리거별 코칭 프롬프트를 생성합니다."""
        
        base_instruction = """당신은 팀 내 갈등 해결을 돕는 전문 코치입니다. 
다음 대화 상황에서 건설적이고 실용적인 조언을 해주세요.
- 50자 이내로 간결하게 답변하세요
- 비난하지 말고 해결 방향을 제시하세요  
- 한국어 존댓말로 답변하세요"""
        
        # 대화 내용과 감정 정보 포함
        context_text = ""
        emotions_list = []
        
        for conv in conversation_with_emotions:
            context_text += f"{conv['speaker']}: {conv['text']} [감정: {conv['emotion']}, 점수: {conv['score']}, 강도: {conv['magnitude']}]\n"
            emotions_list.append(conv['emotion'])
        
        # 트리거별 상황 설명
        trigger_specific = ""
        if trigger_info["type"] == "immediate":
            trigger_specific = """강한 부정 감정이 감지되었습니다. 
즉시 상황을 진정시키고 대화를 건설적으로 이끌 수 있는 조언을 해주세요."""
            
        elif trigger_info["type"] == "pattern":
            trigger_specific = """연속된 부정적 감정 패턴이 감지되었습니다. 
근본적인 문제 해결을 위한 구체적인 방법을 제시해주세요."""
            
        elif trigger_info["type"] == "escalation":
            trigger_specific = """감정이 점점 악화되고 있습니다. 
갈등이 더 커지기 전에 중재할 수 있는 방법을 알려주세요."""
            
        elif trigger_info["type"] == "silence-negative":
            trigger_specific = """침묵 후 부정적인 감정으로 대화가 재개되었습니다.
갈등 상황을 완화하고 건설적인 대화로 이끌 수 있는 방법을 제시해주세요."""

        elif trigger_info["type"] == "long-silence":
            trigger_specific = """대화가 장시간 중단되었습니다.
소통을 다시 활성화하고 분위기를 개선할 수 있는 방법을 알려주세요."""

        elif trigger_info["type"] == "silence-resume":
            trigger_specific = """침묵 후 대화가 재개되었습니다.
원활한 소통을 위한 간단한 조언을 해주세요."""
        
        return f"""{base_instruction}

{trigger_specific}

**대화 내용:**
{context_text}

**감정 패턴 분석:**
- 최근 감정: {emotions_list}
- 트리거: {trigger_info.get('type', 'unknown')}
- 상황: {trigger_info.get('reason', '')}

코칭 조언:"""

    def get_coaching_interval(self, recent_emotions: List[str]) -> int:
        """
        현재 대화 상황에 따른 코칭 체크 주기를 결정합니다.
        
        Returns:
            int: 체크 주기 (초)
        """
        if not recent_emotions:
            return 60  # 기본 1분
            
        # 감정 강도 계산
        emotion_weights = {
            'angry': 1.0,
            'frustrated': 0.8, 
            'concerned': 0.6,
            'sad': 0.5,
            'neutral': 0.0,
            'happy': -0.2
        }
        
        recent_score = sum(emotion_weights.get(emotion, 0) for emotion in recent_emotions[-3:])
        conversation_heat = recent_score / len(recent_emotions[-3:]) if recent_emotions[-3:] else 0
        
        if conversation_heat > 0.8:  # 매우 격한 상황
            return 15  # 15초마다 체크
        elif conversation_heat > 0.5:  # 긴장된 상황  
            return 30  # 30초마다 체크
        elif conversation_heat > 0.2:  # 약간 부정적
            return 45  # 45초마다 체크
        else:
            return 60  # 평상시 1분마다

    def should_provide_coaching(self, 
                              recent_emotions: List[str], 
                              conversation_context: List[Dict],
                              last_coaching_time: Optional[float] = None) -> bool:
        """
        현재 상황에서 코칭을 제공해야 하는지 판단합니다.
        
        Args:
            recent_emotions: 최근 감정 리스트
            conversation_context: 대화 맥락
            last_coaching_time: 마지막 코칭 시간 (timestamp)
            
        Returns:
            bool: 코칭 제공 여부
        """
        import time
        
        current_time = time.time()
        
        # 감정 패턴 분석
        trigger_info = self.analyze_emotion_pattern(recent_emotions)
        
        if not trigger_info["trigger"]:
            return False
            
        # 즉시 개입이 필요한 경우
        if trigger_info["urgency"] == "high":
            return True
            
        # 최근에 코칭한 경우 중복 방지
        if last_coaching_time:
            min_interval = 30 if trigger_info["urgency"] == "medium" else 60
            if current_time - last_coaching_time < min_interval:
                return False
                
        return True