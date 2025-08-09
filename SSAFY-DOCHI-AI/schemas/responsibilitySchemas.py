from pydantic import BaseModel

class ResponsibilityInput(BaseModel):
    roomId: str
    speaker: str
    text: str