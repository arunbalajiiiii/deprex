import re

CRISIS_SAFETY_REPLY = (
    "I hear how much pain you are in right now, and I want you to be safe. "
    "Please connect with someone who can support you immediately: you can call or text the "
    "Suicide & Crisis Lifeline at 988 (free, confidential, available 24/7). "
    "You do not have to carry this alone."
)

CRISIS_PATTERNS = [
    r"\bkill\s+myself\b",
    r"\bend\s+my\s+life\b",
    r"\bcommit\s+suicide\b",
    r"\bwant\s+to\s+die\b",
    r"\bwish\s+i\s+were\s+dead\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bhang\s+myself\b",
    r"\bcut\s+my\s+wrist[s]?\b",
    r"\bslit\s+my\s+wrist[s]?\b",
    r"\btake\s+all\s+(my\s+)?pills\b",
    r"\boverdose\s+on\b",
    r"\bshoot\s+myself\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bcan['’]?t\s+go\s+on\s+living\b",
]

COMPILED_CRISIS_REGEX = re.compile("|".join(CRISIS_PATTERNS), re.IGNORECASE)


def detect_crisis_intent(text: str) -> bool:
    """
    Deterministically scan user message for explicit self-harm or suicidal intent.
    Returns True if an acute crisis phrase is detected.
    """
    if not text:
        return False

    return bool(COMPILED_CRISIS_REGEX.search(text))
