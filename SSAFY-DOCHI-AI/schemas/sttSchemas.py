from pydantic import BaseModel
from datetime import datetime

class STTInput(BaseModel):
    roomId: str
    speaker: str
    timestamp: datetime
    text: str
