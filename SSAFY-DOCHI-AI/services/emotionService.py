from google.cloud import language_v1
from google.oauth2 import service_account
import os

class EmotionService:
    def __init__(self):
        """Google Cloud Natural Language API 클라이언트를 초기화합니다."""
        try:
            # 여러 가능한 경로에서 서비스 계정 키 파일 찾기
            possible_paths = [
                '/app/google-service-account.json',  # Docker 컨테이너 내부
                './google-service-account.json',     # 현재 디렉토리
                'google-service-account.json',       # 현재 디렉토리 (상대 경로)
                os.path.join(os.path.dirname(__file__), '..', 'google-service-account.json')  # 프로젝트 루트
            ]
            
            key_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    key_path = path
                    break
            
            if key_path:
                credentials = service_account.Credentials.from_service_account_file(key_path)
                self.client = language_v1.LanguageServiceClient(credentials=credentials)
                print(f"Google Cloud API 인증 성공: 서비스 계정 키 파일 사용 ({key_path})")
            else:
                # 환경 변수를 사용하는 방법 (fallback)
                print("서비스 계정 키 파일을 찾을 수 없음, 환경 변수 사용 시도")
                self.client = language_v1.LanguageServiceClient()
                print("Google Cloud API 인증: 환경 변수 사용")
        except Exception as e:
            print(f"Google Cloud API 인증 실패: {e}")
            print(f"시도한 경로들: {possible_paths}")
            self.client = None
            
    def analyze_conversation_emotion(self, conversation: list[dict]) -> dict:
        """
        대화 내용(conversation)을 바탕으로 마지막 발언의 감정을 분석합니다.
        
        Args:
            conversation (list[dict]): [{"speaker": "화자1", "text": "안녕하세요."}, ...] 형식의 대화 기록
        
        Returns:
            dict: 마지막 발언에 대한 감정 분석 결과
        """
        if not conversation:
            return {"error": "Conversation is empty."}

        # 1. 분석할 대상(마지막 발언)과 이전 대화(문맥) 분리
        latest_utterance = conversation[-1]
        context_conversation = conversation[:-1]
        current_text = latest_utterance['text']

        # 2. 문맥을 포함한 분석 (최근 2-3개 발언만 사용)
        if context_conversation:
            recent_context = context_conversation[-2:] if len(context_conversation) > 2 else context_conversation
            context_text = " ".join([f"{conv['speaker']}: {conv['text']}" for conv in recent_context])
            full_text_for_analysis = f"{context_text} {latest_utterance['speaker']}: {current_text}"
        else:
            # 문맥이 없으면 현재 발언만 사용
            full_text_for_analysis = current_text
            
        document = language_v1.Document(
            content=full_text_for_analysis,
            type_=language_v1.Document.Type.PLAIN_TEXT,
            language='ko'
        )

        try:
            # 클라이언트가 초기화되지 않은 경우
            if self.client is None:
                return {
                    "speaker": latest_utterance['speaker'],
                    "text": latest_utterance['text'],
                    "emotion": "neutral",
                    "score": 0.0,
                    "magnitude": 0.0,
                    "message": "Google Cloud API 클라이언트가 초기화되지 않았습니다."
                }
            
            # 4. 문맥을 포함한 감정 분석 (단일 API 호출)
            response = self.client.analyze_sentiment(document=document)
            sentiment = response.document_sentiment
            
            # 5. 한국어 특성을 고려한 더 세분화된 감정 분류
            emotion = self._classify_korean_emotion(current_text, sentiment.score, sentiment.magnitude)
            
            # 6. 분석 결과에 화자 정보 포함하여 반환
            return {
                "speaker": latest_utterance['speaker'],
                "text": latest_utterance['text'],
                "emotion": emotion,
                "score": round(sentiment.score, 3),
                "magnitude": round(sentiment.magnitude, 3)
            }

        except Exception as e:
            print(f"Google NLP API 호출 중 오류 발생: {e}")
            return {"speaker": latest_utterance.get('speaker', 'unknown'), "emotion": "error", "message": str(e)}
    
    def _classify_korean_emotion(self, text: str, score: float, magnitude: float) -> str:
        """
        한국어 특성을 고려하여 더 세분화된 감정 분류를 수행합니다.
        
        Args:
            text (str): 분석할 텍스트
            score (float): Google API 감정 점수 (-1.0 ~ 1.0)
            magnitude (float): 감정 강도 (0.0 ~ 무한대)
        
        Returns:
            str: 분류된 감정 (happy, sad, angry, frustrated, concerned, neutral)
        """
        text_lower = text.lower()
        
        # 한국어 감정 키워드 패턴 (확장 및 정교화)
        frustrated_patterns = [
            '답답', '스트레스', '힘들', '지쳤', '늦어졌', '꼬입니다', '피해', 
            '문제', '오해', '일정', '마감', '계속', '매번', '또', '반복',
            '바뀜', '요구사항', '수정', '범위', '커질', '몰랐', '늦게'
        ]
        
        concerned_patterns = [
            '걱정', '불안', '어떡해', '어쩌지', '문제', '위험', '확인',
            '일정', '마감', '늦', '계획', '바뀜', '요구', '직전', '가능성'
        ]
        
        angry_patterns = [
            '화가', '짜증', '열받', '빡쳐', '어이없', '말도 안돼', '황당',
            '정말', '진짜', 'seriously', '어떻게', '개발팀', '전체 팀'
        ]
        
        sad_patterns = [
            '속상', '서운', '실망', '억울', '슬프', '미안', '죄송', 
            '후회', '안 좋', '우울', '몰랐', '어쩔 수 없'
        ]
        
        positive_patterns = [
            '좋', '기뻐', '행복', '만족', '고마', '감사', '훌륭', '완벽',
            '성공', '해결', '잘됐', '다행', '알겠', '네', '좋겠', '마무리',
            '공유', '늘립시다'
        ]
        
        # 한국어 간접 표현 패턴 (부정적 뉘앙스)
        indirect_negative = [
            '그런데', '하지만', '근데', '사실', '솔직히',
            '좀 더', '아무래도', '그냥', '뭔가', '대신', '확인만'
        ]
        
        # 키워드 매칭
        has_frustrated = any(pattern in text_lower for pattern in frustrated_patterns)
        has_concerned = any(pattern in text_lower for pattern in concerned_patterns) 
        has_angry = any(pattern in text_lower for pattern in angry_patterns)
        has_sad = any(pattern in text_lower for pattern in sad_patterns)
        has_positive = any(pattern in text_lower for pattern in positive_patterns)
        has_indirect = any(pattern in text_lower for pattern in indirect_negative)
        
        # 감탄부호, 물음표로 감정 강도 측정
        exclamation_count = text.count('!')
        question_count = text.count('?')
        emotional_punctuation = exclamation_count + question_count
        
        # 감정 분류 로직 (키워드 가중치 강화, 점수 0 대응)
        # 키워드가 명확하면 점수와 상관없이 해당 감정으로 분류
        if has_positive and (score >= 0 or magnitude > 0.3):
            return "happy"
        elif has_angry or (score < -0.3 and magnitude > 0.7):
            return "angry"  
        elif has_frustrated or (score <= 0 and magnitude > 0.2 and has_indirect):
            return "frustrated"
        elif has_concerned or (emotional_punctuation > 0 and score <= 0.1):
            return "concerned"
        elif has_sad or (score < -0.05 and has_indirect):
            return "sad"
        elif score > 0.2:
            return "happy"
        elif score < -0.2:
            return "sad"
        else:
            return "neutral"
    

    def analyzeEmotion(self, text: str) -> dict:
        """Google Natural Language API를 사용하여 텍스트에서 감정을 분석합니다."""
        if not text:
            return { "emotion": "neutral", "score": 0.0, "magnitude": 0.0 }

        document = language_v1.Document(
            content=text, 
            type_=language_v1.Document.Type.PLAIN_TEXT,
            language='ko'  # 한국어 분석을 위해 언어 코드 설정
        )

        try:
            # 클라이언트가 초기화되지 않은 경우
            if self.client is None:
                return {
                    "emotion": "neutral",
                    "score": 0.0,
                    "magnitude": 0.0,
                    "message": "Google Cloud API 클라이언트가 초기화되지 않았습니다."
                }
            
            # API를 호출하여 감정 분석 수행
            response = self.client.analyze_sentiment(document=document)
            sentiment = response.document_sentiment

            # 한국어 특성을 고려한 감정 분류 적용
            emotion = self._classify_korean_emotion(text, sentiment.score, sentiment.magnitude)

            return {
                "emotion": emotion,
                "score": round(sentiment.score, 3),          # 긍정/부정 점수 (-1.0 ~ 1.0)
                "magnitude": round(sentiment.magnitude, 3)   # 감정의 강도 (0 ~ 무한대)
            }

        except Exception as e:
            print(f"Google NLP API 호출 중 오류 발생: {e}")
            return { "emotion": "error", "message": str(e) }