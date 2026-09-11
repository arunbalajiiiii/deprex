from typing import Optional
from app.wellbeing.schemas import PHQ9Evaluation, SeverityBand


def classify_severity(score: int) -> SeverityBand:
    """Classify depression severity based on clinical PHQ-9 thresholds."""
    if score <= 4:
        return "Minimal"
    elif score <= 9:
        return "Mild"
    elif score <= 14:
        return "Moderate"
    elif score <= 19:
        return "Moderately Severe"
    else:
        return "Severe"


def evaluate_phq9(
    answers: Optional[list[int]] = None,
    fallback_score: Optional[int] = None,
    fallback_risk: Optional[float] = None,
) -> PHQ9Evaluation:
    """
    Pure domain evaluator for PHQ-9 questionnaire responses.
    Calculates total score, normalized risk, severity band, and Question 9 self-harm flag.
    """
    if answers is not None and len(answers) > 0:
        # Clamp each response to valid PHQ-9 range (0 - 3)
        clamped_answers = [max(0, min(3, int(a))) for a in answers]
        score = sum(clamped_answers)
        # Question 9 (index 8): thoughts that you would be better off dead or of hurting yourself
        has_suicide = len(clamped_answers) >= 9 and clamped_answers[8] > 0
        risk = round(score / 27.0, 4)
    elif fallback_score is not None:
        score = max(0, min(27, int(fallback_score)))
        has_suicide = False
        risk = round(score / 27.0, 4) if fallback_risk is None else round(max(0.0, min(1.0, fallback_risk)), 4)
    else:
        raise ValueError("Either answers list or fallback_score must be provided.")

    severity = classify_severity(score)
    return PHQ9Evaluation(
        score=score,
        risk=risk,
        severity=severity,
        has_suicidal_ideation=has_suicide,
    )
