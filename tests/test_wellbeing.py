import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.models.database import User, Assessment, ChatEvent, init_db
from app.auth import get_current_user
from app.intelligence import get_intelligence, InMemoryIntelligenceAdapter
from app.wellbeing.scorer import evaluate_phq9, classify_severity


# ── Domain Scorer Unit Tests ───────────────────────────────────────────────────

def test_classify_severity_boundaries():
    assert classify_severity(0) == "Minimal"
    assert classify_severity(4) == "Minimal"
    assert classify_severity(5) == "Mild"
    assert classify_severity(9) == "Mild"
    assert classify_severity(10) == "Moderate"
    assert classify_severity(14) == "Moderate"
    assert classify_severity(15) == "Moderately Severe"
    assert classify_severity(19) == "Moderately Severe"
    assert classify_severity(20) == "Severe"
    assert classify_severity(27) == "Severe"


def test_evaluate_phq9_minimal():
    answers = [0] * 9
    eval_res = evaluate_phq9(answers)
    assert eval_res.score == 0
    assert eval_res.risk == 0.0
    assert eval_res.severity == "Minimal"
    assert not eval_res.has_suicidal_ideation


def test_evaluate_phq9_severe_with_suicide_flag():
    # Question 9 is index 8
    answers = [2, 2, 2, 3, 3, 3, 2, 3, 1]
    eval_res = evaluate_phq9(answers)
    assert eval_res.score == 21
    assert eval_res.severity == "Severe"
    assert eval_res.has_suicidal_ideation is True


def test_evaluate_phq9_clamps_out_of_bound_inputs():
    answers = [-5, 10, 2]  # Clamped to 0, 3, 2
    eval_res = evaluate_phq9(answers)
    assert eval_res.score == 5
    assert eval_res.severity == "Mild"


def test_evaluate_phq9_fallback_support():
    eval_res = evaluate_phq9(fallback_score=12, fallback_risk=0.44)
    assert eval_res.score == 12
    assert eval_res.risk == 0.44
    assert eval_res.severity == "Moderate"


# ── Router & Service Integration Tests ─────────────────────────────────────────

@pytest.fixture
def mock_user():
    return User(
        id=42,
        name="ClinicalTestUser",
        email="clinical@example.com",
        password="hash",
        interests=["Chess"],
        sub_interests={},
        onboarded=True,
    )


@pytest_asyncio.fixture
async def client(mock_user):
    await init_db()
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_intelligence] = lambda: InMemoryIntelligenceAdapter()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_save_assessment_with_raw_answers(client, mock_user):
    payload = {
        "answers": [1, 1, 2, 1, 0, 1, 0, 1, 0]  # Sum = 7 -> Mild
    }
    response = await client.post("/assessment/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["score"] == 7
    assert data["severity"] == "Mild"
    assert data["has_suicidal_ideation"] is False
    assert "coping_insight" in data
    assert "Chess" in data["coping_insight"] or "mindful" in data["coping_insight"]


@pytest.mark.asyncio
async def test_save_assessment_triggers_atomic_timeline_event(client, mock_user):
    from app.models.database import engine
    from sqlalchemy.ext.asyncio import AsyncSession

    payload = {
        "answers": [3, 3, 3, 3, 3, 3, 3, 3, 2]  # Severe + suicide risk
    }
    response = await client.post("/assessment/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["has_suicidal_ideation"] is True
    assert "988" in data["coping_insight"]

    # Verify atomic ChatEvent creation in database
    async with AsyncSession(engine) as session:
        events = await session.execute(
            select(ChatEvent).where(ChatEvent.user_id == mock_user.id).order_by(ChatEvent.id.desc())
        )
        latest_event = events.scalars().first()
        assert latest_event is not None
        assert latest_event.level == "crisis"
        assert "suicide_risk" in latest_event.flags


@pytest.mark.asyncio
async def test_get_patient_summary(client):
    response = await client.get("/assessment/summary")
    assert response.status_code == 200
    data = response.json()
    assert "latest_score" in data
    assert "suggested_companion_posture" in data
    assert "trend" in data
