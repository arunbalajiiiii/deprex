# ─── DEPREX DOMAIN RESOURCE CATALOG ──────────────────────────────────────────
# Standardized clinical PHQ-9 questions and curated interest relief activities.

PHQ9_QUESTIONS = [
    "1. Little interest or pleasure in doing things",
    "2. Feeling down, depressed, or hopeless",
    "3. Trouble falling or staying asleep, or sleeping too much",
    "4. Feeling tired or having little energy",
    "5. Poor appetite or overeating",
    "6. Feeling bad about yourself — or that you are a failure or have let yourself or family down",
    "7. Trouble concentrating on things, such as reading or watching television",
    "8. Moving or speaking so slowly that others have noticed, or being fidgety/restless",
    "9. Thoughts that you would be better off dead, or of hurting yourself in some way",
]

PHQ9_OPTIONS = [
    (0, "0 — Not at all"),
    (1, "1 — Several days"),
    (2, "2 — More than half the days"),
    (3, "3 — Nearly every day"),
]

GROUNDING_TECHNIQUES = [
    {
        "title": "Box Breathing (4-4-4-4)",
        "desc": "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Activates parasympathetic calm.",
        "icon": "🌬️",
        "time": "2 min",
    },
    {
        "title": "5-4-3-2-1 Sensory Grounding",
        "desc": "Identify 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.",
        "icon": "🌿",
        "time": "3 min",
    },
    {
        "title": "Progressive Muscle Relaxation",
        "desc": "Tense each muscle group for 5 seconds, then consciously release from toes to head.",
        "icon": "🧘",
        "time": "5 min",
    },
    {
        "title": "Cold Water Reset",
        "desc": "Splash cold water on face or hold an ice cube to stimulate the mammalian dive reflex.",
        "icon": "💧",
        "time": "1 min",
    },
    {
        "title": "Mindful Worry Dump",
        "desc": "Freely write down all spiraling thoughts without judgment, clearing cognitive RAM.",
        "icon": "✍️",
        "time": "5 min",
    },
]

INTEREST_CATALOG = {
    "Chess": [
        {"title": "Lichess — Free & Open Source", "desc": "Play against friendly bots or solve puzzles with no account needed.", "url": "https://lichess.org", "icon": "♟️"},
        {"title": "Daily Tactics Trainer", "desc": "Solve focused tactical puzzles to redirect anxious energy into pattern-solving.", "url": "https://lichess.org/training", "icon": "🧩"},
    ],
    "Sudoku": [
        {"title": "Web Sudoku", "desc": "Billions of calm, distraction-free number puzzles across all skill tiers.", "url": "https://www.websudoku.com", "icon": "🔢"},
        {"title": "Puzzle Sudoku", "desc": "Clean daily puzzle challenges to help ground attention.", "url": "https://www.puzzle-sudoku.com", "icon": "📐"},
    ],
    "Music & Audio": [
        {"title": "Lofi Girl 24/7 Stream", "desc": "Soothing lo-fi beats designed for relaxation and gentle focus.", "url": "https://www.youtube.com/watch?v=jfKfPfyJRdk", "icon": "🎧"},
        {"title": "Nature Soundscapes (Rain & Forest)", "desc": "Gentle acoustic immersion to soothe nervous tension.", "url": "https://mynoise.net", "icon": "🌲"},
    ],
    "Drawing & Art": [
        {"title": "AutoDraw by Google", "desc": "Creative machine-learning sketchpad to freely draw with no pressure.", "url": "https://www.autodraw.com", "icon": "🎨"},
        {"title": "Pixilart Studio", "desc": "Relaxing pixel art canvas in your browser.", "url": "https://www.pixilart.com/draw", "icon": "🖌️"},
    ],
    "Mindfulness & Yoga": [
        {"title": "10-Minute Gentle Yoga", "desc": "Slow physical unwinding for physical tension and shallow breathing.", "url": "https://www.youtube.com/watch?v=v7AYKMP6rOE", "icon": "🧘"},
        {"title": "Guided Body Scan Meditation", "desc": "Systematic mindful relaxation audio track.", "url": "https://insighttimer.com", "icon": "✨"},
    ],
}
