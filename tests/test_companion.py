import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.models.database import User, ChatMessage, ChatEvent, init_db, engine
from app.auth import get_current_user
from app.intelligence import get_intelligence, InMemoryIntelligenceAdapter
from app.companion.guardrails import detect_crisis_intent


# ── Crisis Guardrail Unit Tests ────────────────────────────────────────────────

def test_detect_crisis_intent_triggers():
    assert detect_crisis_intent("I want to kill myself right now.") is True
    assert detect_crisis_intent("I've decided to end my life.") is True
    assert detect_crisis_intent("I want to die, nobody cares.") is True
    assert detect_crisis_intent("Everyone would be better off dead without me.") is True
    assert detect_crisis_intent("I have a plan to take all my pills.") is True
    assert detect_crisis_intent("I'm going to hang myself.") is True


def test_detect_crisis_intent_avoids_false_positives():
    assert detect_crisis_intent("I am killing time while waiting for my flight.") is False
    assert detect_crisis_intent("That movie had me dying of laughter.") is False
    assert detect_crisis_intent("I feel a little down and tired today.") is False
    assert detect_crisis_intent("I had a stressful meeting at work.") is False
    assert detect_crisis_intent("") is False


# ── Companion Service & Router Integration Tests ───────────────────────────────

@pytest.fixture
def companion_user():
    return User(
        id=77,
        name="CompanionTestUser",
        email="companion@example.com",
        password="hash",
        interests=["Chess"],
        sub_interests={},
        onboarded=True,
    )


@pytest_asyncio.fixture
async def client(companion_user):
    await init_db()
    app.dependency_overrides[get_current_user] = lambda: companion_user
    app.dependency_overrides[get_intelligence] = lambda: InMemoryIntelligenceAdapter()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_crisis_guardrail_interception_bypasses_llm(client, companion_user):
    from sqlalchemy.ext.asyncio import AsyncSession

    payload = {"content": "I don't see any reason to go on, I want to kill myself."}
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isCrisisIntervention"] is True
    assert "988" in data["reply"]

    # Verify persistent DB records for both user and assistant
    async with AsyncSession(engine) as session:
        msgs_res = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == companion_user.id)
            .order_by(ChatMessage.id.asc())
        )
        msgs = msgs_res.scalars().all()
        assert len(msgs) >= 2
        assert msgs[-2].role == "user"
        assert msgs[-1].role == "assistant"
        assert "988" in msgs[-1].content

        events_res = await session.execute(
            select(ChatEvent)
            .where(ChatEvent.user_id == companion_user.id)
            .order_by(ChatEvent.id.desc())
        )
        event = events_res.scalars().first()
        assert event.level == "crisis"
        assert "crisis_guardrail_triggered" in event.flags


@pytest.mark.asyncio
async def test_chat_message_persistence_and_history(client, companion_user):
    # Send a standard non-crisis message
    payload = {"content": "Can you recommend a calming routine for today?"}
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isCrisisIntervention"] is False
    assert "CompanionTestUser" in data["reply"]

    # Retrieve history
    history_res = await client.get("/ai/chat/history")
    assert history_res.status_code == 200
    history = history_res.json()["messages"]
    assert len(history) >= 2

    # Check last two messages are the query and response
    last_user_msg = [m for m in history if m["role"] == "user"][-1]
    last_assistant_msg = [m for m in history if m["role"] == "assistant"][-1]

    assert "calming routine" in last_user_msg["content"]
    assert "CompanionTestUser" in last_assistant_msg["content"]


@pytest.mark.asyncio
async def test_companion_service_error_rollback_on_failure(client, companion_user):
    from sqlalchemy.ext.asyncio import AsyncSession

    # Sending a message containing "simulate_error" causes InMemoryIntelligenceAdapter to raise IntelligenceUnavailableError
    payload = {"content": "simulate_error trigger failure"}
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 502
    assert "Simulated companion service is unavailable" in response.json()["detail"]

    # Verify that no orphaned user message was committed to the database
    async with AsyncSession(engine) as session:
        msgs_res = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == companion_user.id)
            .where(ChatMessage.content.contains("simulate_error"))
        )
        orphaned_msgs = msgs_res.scalars().all()
        assert len(orphaned_msgs) == 0

