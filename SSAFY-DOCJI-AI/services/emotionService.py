from typing import Dict, List

class EmotionService:
    def __init__(self):
        self.emotionKeywords = {
            "angry": ["화나", "짜증", "열받", "빡쳐", "싫어", "미워", "화가", "분노"],
            "sad": ["슬프", "우울", "힘들", "속상", "아프", "눈물", "슬퍼", "절망"],
            "happy": ["기뻐", "좋아", "행복", "즐거", "신나", "웃음", "기분좋", "만족"],
            "anxious": ["걱정", "불안", "두려", "무서", "긴장", "떨려", "조심"],
            "frustrated": ["답답", "막막", "곤란", "어렵", "복잡", "헷갈", "골치"],
            "positive": ["감사", "고마워", "훌륭", "멋져", "완벽", "최고", "잘했", "대단"]
        }
    
    def analyzeEmotion(self, text: str) -> Dict:
        """텍스트에서 감정을 분석합니다."""
        textLower = text.lower().replace(" ", "")
        emotionScores = {}
        detectedKeywords = []
        
        for emotion, keywords in self.emotionKeywords.items():
            score = 0
            emotionKeywordsFound = []
            
            for keyword in keywords:
                if keyword in textLower:
                    score += 1
                    emotionKeywordsFound.append(keyword)
            
            if score > 0:
                emotionScores[emotion] = score
                detectedKeywords.extend(emotionKeywordsFound)
        
        if not emotionScores:
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "intensity": 0.3,
                "detectedKeywords": []
            }
        
        # 가장 높은 점수의 감정 선택
        dominantEmotion = max(emotionScores, key=emotionScores.get)
        maxScore = emotionScores[dominantEmotion]
        confidence = min(0.95, 0.6 + (maxScore * 0.15))
        intensity = min(1.0, maxScore * 0.25 + 0.3)
        
        return {
            "emotion": dominantEmotion,
            "confidence": confidence,
            "intensity": intensity,
            "detectedKeywords": detectedKeywords[:3]
        }