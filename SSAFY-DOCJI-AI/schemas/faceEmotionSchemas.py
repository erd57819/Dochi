from pydantic import BaseModel
from typing import Dict
from datetime import datetime

class FaceEmotionInput(BaseModel):
    roomId: str
    speaker: str
    timestamp: datetime
    emotions: Dict[str, float]