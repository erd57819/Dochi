from typing import Dict, List

class ConflictService:
    def __init__(self):
        self.highConflictIndicators = [
            "잘못", "문제", "틀렸", "이상해", "말도 안", "어이없", "웃기", 
            "진짜로", "심각", "화나", "짜증", "못참", "한심", "바보"
        ]
        
        self.mediumConflictIndicators = [
            "왜 그래", "뭔데", "이해 안", "모르겠", "답답", "힘들", 
            "곤란", "어렵", "복잡", "애매"
        ]
        
        self.positiveIndicators = [
            "좋아", "맞아", "그래", "이해", "동의", "괜찮", "고마워", 
            "미안", "죄송", "알겠", "그렇구나", "맞네"
        ]
    
    def analyzeConflictRisk(self, text: str, context: List[Dict] = None) -> Dict:
        """갈등 위험도를 분석합니다."""
        textLower = text.lower().replace(" ", "")
        conflictScore = 0.0
        indicatorsFound = []
        
        # 고위험 지표 확인
        for indicator in self.highConflictIndicators:
            if indicator in textLower:
                conflictScore += 2.0
                indicatorsFound.append(f"고위험: {indicator}")
        
        # 중위험 지표 확인
        for indicator in self.mediumConflictIndicators:
            if indicator in textLower:
                conflictScore += 1.0
                indicatorsFound.append(f"중위험: {indicator}")
        
        # 긍정적 지표로 점수 감소
        positiveCount = 0
        for positive in self.positiveIndicators:
            if positive in textLower:
                positiveCount += 1
        
        if positiveCount > 0:
            conflictScore -= (positiveCount * 0.8)
            indicatorsFound.append(f"긍정적 표현 {positiveCount}개")
        
        # 어조 분석
        exclamationCount = text.count('!')
        if exclamationCount >= 3:
            conflictScore += 1.5
            indicatorsFound.append("과도한 강조 (!!!)")
        elif exclamationCount >= 2:
            conflictScore += 0.8
            indicatorsFound.append("강한 어조 (!!)")
        
        # 컨텍스트 분석
        if context and len(context) > 1:
            recentNegative = 0
            for msg in context[-3:]:
                msgText = msg.get('text', '').lower()
                for indicator in self.highConflictIndicators + self.mediumConflictIndicators:
                    if indicator in msgText:
                        recentNegative += 1
                        break
            
            if recentNegative >= 2:
                conflictScore += 1.0
                indicatorsFound.append("연속된 부정적 패턴")
        
        # 최종 점수 조정
        conflictScore = max(0.0, conflictScore)
        
        # 위험도 레벨 결정
        if conflictScore >= 4.0:
            riskLevel = "high"
        elif conflictScore >= 2.0:
            riskLevel = "medium"
        else:
            riskLevel = "low"
        
        return {
            "riskLevel": riskLevel,
            "riskScore": min(1.0, conflictScore / 5.0),
            "indicators": indicatorsFound,
            "rawScore": conflictScore
        }
    
    def generateFeedbackSuggestions(self, emotionAnalysis: Dict, conflictAnalysis: Dict, text: str) -> List[str]:
        """분석 결과 기반 피드백 제안을 생성합니다."""
        suggestions = []
        emotion = emotionAnalysis.get("emotion", "neutral")
        riskLevel = conflictAnalysis.get("riskLevel", "low")
        
        if riskLevel == "high":
            suggestions.extend([
                "대화 톤이 공격적으로 감지됩니다. 차분하게 이야기해보세요.",
                "구체적인 사실에 집중하여 객관적으로 말씀해보세요.",
                "상대방의 입장에서 생각해보시는 것이 어떨까요?",
                "잠시 휴식을 취하고 대화를 재개해보세요."
            ])
        elif riskLevel == "medium":
            suggestions.extend([
                "대화에 약간의 긴장감이 감지됩니다. 부드러운 어조로 이야기해보세요.",
                "상대방의 의견을 먼저 충분히 들어보신 후 말씀해보세요.",
                "구체적인 예시를 들어서 설명하면 더 잘 전달될 것 같습니다."
            ])
        
        if emotion in ["angry", "frustrated"]:
            suggestions.extend([
                "화가 나는 감정이 느껴집니다. 감정을 인정하되 표현 방식을 조절해보세요.",
                "'지금 제가 화가 나는 이유는...' 이라고 시작해보세요."
            ])
        elif emotion == "sad":
            suggestions.append("힘든 감정이 느껴집니다. 솔직하게 어떤 부분이 속상한지 말씀해보세요.")
        elif emotion in ["happy", "positive"]:
            suggestions.extend([
                "긍정적인 대화 분위기를 잘 만들어가고 계십니다!",
                "이러한 좋은 분위기를 계속 유지해보세요."
            ])
        
        # 중복 제거 및 최대 4개로 제한
        uniqueSuggestions = list(dict.fromkeys(suggestions))
        return uniqueSuggestions[:4]