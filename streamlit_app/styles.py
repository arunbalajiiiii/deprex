import streamlit as st

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Background canvas glow */
.stApp {
    background: radial-gradient(circle at 20% 15%, rgba(139, 92, 246, 0.08) 0%, rgba(8, 8, 17, 1) 60%, rgba(10, 18, 32, 1) 100%) !important;
}

/* Glassmorphism Cards */
.dx-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(139, 92, 246, 0.18);
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
    transition: transform 0.2s ease, border-color 0.2s ease;
}

.dx-card:hover {
    border-color: rgba(139, 92, 246, 0.38);
}

/* Header & Typography */
.dx-header {
    text-align: center;
    padding: 20px 0 30px 0;
}

.dx-title {
    font-size: 2.8rem;
    font-weight: 800;
    background: linear-gradient(135deg, #c084fc 0%, #60a5fa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
}

.dx-subtitle {
    color: rgba(255, 255, 255, 0.55);
    font-size: 1.05rem;
    font-weight: 400;
}

/* Crisis Safety Banner */
.dx-crisis-banner {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%);
    border: 1px solid rgba(239, 68, 68, 0.5);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    animation: pulseGlow 3s infinite alternate;
}

@keyframes pulseGlow {
    from { box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
    to { box-shadow: 0 0 25px rgba(239, 68, 68, 0.45); }
}

/* Chat Speech Bubbles */
.chat-bubble-user {
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    color: #ffffff;
    padding: 14px 18px;
    border-radius: 18px 18px 4px 18px;
    max-width: 80%;
    margin-left: auto;
    margin-bottom: 12px;
    font-size: 0.95rem;
    line-height: 1.5;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.25);
}

.chat-bubble-companion {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.25);
    color: #f1f5f9;
    padding: 16px 20px;
    border-radius: 18px 18px 18px 4px;
    max-width: 85%;
    margin-right: auto;
    margin-bottom: 14px;
    font-size: 0.95rem;
    line-height: 1.6;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Animated 4-7-8 Breathing Protocol Box */
.breathing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.breathing-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(37, 99, 235, 0.1) 70%);
    border: 3px solid #a855f7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    box-shadow: 0 0 35px rgba(168, 85, 247, 0.4);
    animation: boxBreathe 16s ease-in-out infinite;
}

@keyframes boxBreathe {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    25% { transform: scale(1.45); opacity: 1; box-shadow: 0 0 50px rgba(168, 85, 247, 0.75); }
    50% { transform: scale(1.45); opacity: 1; }
    75% { transform: scale(1); opacity: 0.8; }
}

/* Severity Tag Badges */
.badge-minimal { background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 8px; padding: 4px 10px; font-weight: 600; }
.badge-mild { background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; padding: 4px 10px; font-weight: 600; }
.badge-moderate { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 4px 10px; font-weight: 600; }
.badge-severe { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 4px 10px; font-weight: 600; }

/* Streamlit button enhancements */
div.stButton > button:first-child {
    background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 10px 22px;
    font-weight: 600;
    transition: all 0.2s ease;
}
div.stButton > button:first-child:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
}
</style>
"""

def inject_styles():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
