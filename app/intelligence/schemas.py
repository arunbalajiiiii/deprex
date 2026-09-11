from pydantic import BaseModel, Field
from typing import Literal, Optional


class SentimentResult(BaseModel):
    score: float = Field(
        ...,
        description="Sentiment score ranging from -1.0 (most negative) to 1.0 (most positive)",
        ge=-1.0,
        le=1.0,
    )
    label: Literal["positive", "neutral", "negative"] = Field(
        ...,
        description="Categorical sentiment label",
    )


class CompanionMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class RankResult(BaseModel):
    order: list[int] = Field(
        ...,
        description="0-indexed integer list representing the ranking from most to least relevant",
    )
