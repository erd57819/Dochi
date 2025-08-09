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

        # 2. 이전 대화를 하나의 문자열로 요약하여 문맥 생성
        #    - 간단하게 화자와 텍스트를 나열합니다.
        context_text = " ".join([f"{conv['speaker']}: {conv['text']}" for conv in context_conversation])
        
        # 3. Google NLP API에 전달할 최종 텍스트 생성
        #    - F-string을 사용하여 이전 대화와 현재 발언을 명확히 구분해 전달합니다.
        #    - 이렇게 하면 API가 문맥을 더 잘 이해할 수 있습니다.
        full_text_for_analysis = f"""
        [이전 대화 내용]
        {context_text}
        
        [분석할 현재 발언]
        {latest_utterance['speaker']}: "{latest_utterance['text']}"
        """

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
            
            # 4. API를 호출하여 감정 분석 수행
            response = self.client.analyze_sentiment(document=document)
            sentiment = response.document_sentiment

            if sentiment.score > 0.25:
                emotion = "happy"
            elif sentiment.score < -0.25:
                emotion = "sad"
            else:
                emotion = "neutral"
            
            # 5. 분석 결과에 화자 정보 포함하여 반환
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

            # 감정 점수(score)를 기반으로 감정 상태 결정
            if sentiment.score > 0.25:
                emotion = "happy"
            elif sentiment.score < -0.25:
                emotion = "sad" # 또는 "angry", API는 긍정/부정만 알려주므로 세부 감정은 로직 추가 필요
            else:
                emotion = "neutral"

            return {
                "emotion": emotion,
                "score": round(sentiment.score, 3),          # 긍정/부정 점수 (-1.0 ~ 1.0)
                "magnitude": round(sentiment.magnitude, 3)   # 감정의 강도 (0 ~ 무한대)
            }

        except Exception as e:
            print(f"Google NLP API 호출 중 오류 발생: {e}")
            return { "emotion": "error", "message": str(e) }