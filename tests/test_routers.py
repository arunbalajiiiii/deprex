import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.models.database import User, Journal, init_db, get_db
from app.auth import get_current_user
from app.intelligence import get_intelligence, InMemoryIntelligenceAdapter


@pytest.fixture
def mock_user():
    return User(
        id=1,
        name="TestUser",
        email="test@example.com",
        password="hashed_password",
        interests=["Chess", "Meditation"],
        sub_interests={"Chess": "Puzzles"},
        onboarded=True,
    )


@pytest_asyncio.fixture
async def client(mock_user):
    # Initialize DB schema for tests
    await init_db()

    # Override auth to provide mock_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    # Override intelligence to use in-memory adapter
    app.dependency_overrides[get_intelligence] = lambda: InMemoryIntelligenceAdapter()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_endpoint_success(client):
    payload = {
        "messages": [{"role": "user", "content": "I am feeling overwhelmed."}],
        "risk": 0.2,
        "interests": ["Chess"],
    }
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "TestUser" in data["reply"]


@pytest.mark.asyncio
async def test_chat_endpoint_high_risk_lifeline(client):
    payload = {
        "messages": [{"role": "user", "content": "I can't take this anymore."}],
        "risk": 0.8,
        "interests": [],
    }
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "988" in data["reply"]


@pytest.mark.asyncio
async def test_chat_endpoint_outage_handling(client):
    # Swap to an outage adapter
    app.dependency_overrides[get_intelligence] = lambda: InMemoryIntelligenceAdapter(simulate_outage=True)

    payload = {
        "messages": [{"role": "user", "content": "Hello"}],
        "risk": 0.1,
    }
    response = await client.post("/ai/chat", json=payload)
    assert response.status_code == 502
    assert "unavailable" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_personalise_endpoint(client):
    payload = {
        "interest": "Chess",
        "description": "I love solving puzzles",
        "resources": [
            {"title": "Openings guide", "note": "Learn basic openings"},
            {"title": "Puzzles trainer", "note": "Daily tactical puzzles"},
        ],
    }
    response = await client.post("/ai/personalise", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "order" in data
    assert data["order"][0] == 1  # Puzzles trainer prioritized


@pytest.mark.asyncio
async def test_journal_endpoint_sentiment_scoring(client):
    payload = {
        "content": "Today was wonderful, I felt so happy, calm and grateful."
    }
    response = await client.post("/journal/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["label"] == "positive"
    assert data["sentiment"] > 0.0
    assert "id" in data
