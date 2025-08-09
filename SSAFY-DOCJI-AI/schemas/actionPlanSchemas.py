from pydantic import BaseModel

class ActionPlanInput(BaseModel):
    roomId: str
    speaker: str
    text: str