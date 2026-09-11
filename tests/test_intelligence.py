import pytest
from app.intelligence.in_memory import InMemoryIntelligenceAdapter
from app.intelligence.schemas import CompanionMessage, SentimentResult
from app.intelligence.exceptions import IntelligenceUnavailableError


@pytest.mark.asyncio
async def test_in_memory_sentiment_positive():
    adapter = InMemoryIntelligenceAdapter()
    result = await adapter.analyze_sentiment("Today was a great day, I felt so happy and calm.")
    assert result.label == "positive"
    assert result.score > 0.0


@pytest.mark.asyncio
async def test_in_memory_sentiment_negative():
    adapter = InMemoryIntelligenceAdapter()
    result = await adapter.analyze_sentiment("I am feeling hopeless and terrible, crying all night.")
    assert result.label == "negative"
    assert result.score < 0.0


@pytest.mark.asyncio
async def test_in_memory_sentiment_neutral():
    adapter = InMemoryIntelligenceAdapter()
    result = await adapter.analyze_sentiment("I went to the store and bought some milk.")
    assert result.label == "neutral"
    assert result.score == 0.0


@pytest.mark.asyncio
async def test_in_memory_sentiment_outage_fallback():
    adapter = InMemoryIntelligenceAdapter(simulate_outage=True)
    result = await adapter.analyze_sentiment("Anything here")
    assert result.label == "neutral"
    assert result.score == 0.0


@pytest.mark.asyncio
async def test_companion_reply_standard():
    adapter = InMemoryIntelligenceAdapter()
    messages = [CompanionMessage(role="user", content="Hello, I need to talk.")]
    reply = await adapter.generate_companion_reply(
        user_name="Alice",
        messages=messages,
        risk_level="low",
        interests=["Yoga"],
    )
    assert "Alice" in reply
    assert "Yoga" in reply


@pytest.mark.asyncio
async def test_companion_reply_high_risk_triggers_helpline():
    adapter = InMemoryIntelligenceAdapter()
    messages = [CompanionMessage(role="user", content="I cannot keep going like this.")]
    reply = await adapter.generate_companion_reply(
        user_name="Alice",
        messages=messages,
        risk_level="high",
        interests=[],
    )
    assert "988" in reply


@pytest.mark.asyncio
async def test_companion_reply_outage_raises_exception():
    adapter = InMemoryIntelligenceAdapter(simulate_outage=True)
    messages = [CompanionMessage(role="user", content="Hello")]
    with pytest.raises(IntelligenceUnavailableError):
        await adapter.generate_companion_reply(
            user_name="Alice",
            messages=messages,
            risk_level="low",
            interests=[],
        )


@pytest.mark.asyncio
async def test_rank_resources_prioritizes_matching_preference():
    adapter = InMemoryIntelligenceAdapter()
    resources = [
        {"title": "Beginner Chess Openings", "note": "Learn general rules"},
        {"title": "Tactics and Puzzles", "note": "Sharp puzzles for tactical training"},
        {"title": "Endgame Principles", "note": "King and pawn basics"},
    ]
    order = await adapter.rank_resources(
        interest="Chess",
        preference="I love solving sharp puzzles and tactical motifs",
        resources=resources,
    )
    # The tactics item (index 1) should be prioritized first
    assert order[0] == 1


def test_sentiment_result_validation():
    with pytest.raises(ValueError):
        SentimentResult(score=1.5, label="positive")  # Score exceeds max 1.0

    with pytest.raises(ValueError):
        SentimentResult(score=0.5, label="ecstatic")  # Invalid literal
