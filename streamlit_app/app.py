import sys
from pathlib import Path
import streamlit as st
from datetime import datetime

# Ensure repository root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from streamlit_app.styles import inject_styles
from streamlit_app.api_client import api
from streamlit_app.catalog import (
    PHQ9_QUESTIONS,
    PHQ9_OPTIONS,
    GROUNDING_TECHNIQUES,
    INTEREST_CATALOG,
)
from streamlit_app.prototype import (
    render_prototype_switcher,
    render_variant_a,
    render_variant_b,
    render_variant_c,
)

st.set_page_config(
    page_title="Deprex — Mental Health Risk Monitoring & Companion",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

inject_styles()

# ─── Auth View ─────────────────────────────────────────────────────────────────
def render_auth_view():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(
            """
            <div class="dx-header">
                <div style="font-size: 50px; margin-bottom: 8px;">🧠</div>
                <div class="dx-title">Deprex</div>
                <div class="dx-subtitle">Mental Health Risk Monitoring & Conversational Companion</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        with st.container():
            st.markdown('<div class="dx-card">', unsafe_allow_html=True)
            auth_mode = st.radio("Mode", ["Sign In", "Create Account"], horizontal=True, label_visibility="collapsed")

            if auth_mode == "Sign In":
                st.subheader("Welcome back")
                email = st.text_input("Email", placeholder="you@example.com", key="login_email")
                password = st.text_input("Password", type="password", key="login_pwd")

                if st.button("Sign In to Deprex", use_container_width=True):
                    if not email or not password:
                        st.error("Please provide both email and password.")
                    else:
                        try:
                            user = api.login(email.strip(), password)
                            st.success(f"Welcome back, {user['name']}!")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Sign In failed: {str(e)}")

            else:
                st.subheader("Create your private account")
                name = st.text_input("Full Name", placeholder="Your preferred name", key="reg_name")
                email = st.text_input("Email", placeholder="you@example.com", key="reg_email")
                password = st.text_input("Password", type="password", key="reg_pwd")

                if st.button("Create Account & Start", use_container_width=True):
                    if not name or not email or not password:
                        st.error("Please fill in all fields.")
                    else:
                        try:
                            user = api.register(name.strip(), email.strip(), password)
                            st.success(f"Account created! Welcome, {user['name']}.")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Registration failed: {str(e)}")

            st.markdown("</div>", unsafe_allow_html=True)

        st.markdown(
            """
            <p style="text-align: center; color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-top: 15px;">
                ⚕️ Deprex does not replace professional medical diagnosis. Free 24/7 crisis support is available via 988.
            </p>
            """,
            unsafe_allow_html=True,
        )


# ─── Navigation & Session ──────────────────────────────────────────────────────
if not api.token:
    render_auth_view()
    st.stop()

# Ensure current user is loaded
if "current_user" not in st.session_state:
    try:
        st.session_state["current_user"] = api.get_me()
    except Exception:
        api.clear_token()
        st.rerun()

user = st.session_state["current_user"]

# ─── Sidebar Navigation ────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        f"""
        <div style="padding: 10px 0 20px 0;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">🧠</span>
                <div>
                    <strong style="font-size: 1.2rem; color: #fff;">Deprex</strong><br/>
                    <span style="font-size: 0.8rem; color: #4ade80;">● Online • {user.get('name', 'User')}</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    page = st.radio(
        "Navigation",
        [
            "🎨 UI Prototype (3 Designs)",
            "💬 Companion Chat",
            "📊 PHQ-9 Assessment",
            "📖 Reflective Journal",
            "🌬️ Relief & Grounding",
            "👤 Profile & Interests",
        ],
        label_visibility="collapsed",
    )

    st.markdown("---")
    if st.button("Sign Out", use_container_width=True):
        api.clear_token()
        st.rerun()


# ─── Prototype Switcher & Variations ───────────────────────────────────────────
if page == "🎨 UI Prototype (3 Designs)":
    chosen_variant = render_prototype_switcher()
    if chosen_variant == "A":
        render_variant_a(user)
    elif chosen_variant == "B":
        render_variant_b(user)
    elif chosen_variant == "C":
        render_variant_c(user)

# ─── View 1: Companion Chat ────────────────────────────────────────────────────
elif page == "💬 Companion Chat":
    st.markdown(
        """
        <div class="dx-header" style="text-align: left; padding: 10px 0 15px 0;">
            <div class="dx-title" style="font-size: 2.2rem;">AI Companion</div>
            <div class="dx-subtitle">Empathetic dialogue, personalized grounding, and deterministic crisis guardrails.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Emergency Lifeline Quick Banner
    st.markdown(
        """
        <div class="dx-crisis-banner">
            <span style="font-size: 24px;">🆘</span>
            <div>
                <strong style="color: #fca5a5; font-size: 0.95rem;">Need urgent crisis assistance?</strong><br/>
                <span style="color: rgba(255,255,255,0.75); font-size: 0.85rem;">
                    Call or text <strong>988</strong> anytime for free, confidential, 24/7 mental health lifeline support.
                </span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Load persistent history on first run
    if "chat_messages" not in st.session_state:
        db_history = api.get_chat_history()
        st.session_state["chat_messages"] = [
            {"role": m["role"], "content": m["content"], "createdAt": m.get("createdAt")}
            for m in db_history
        ]

    # Render message history
    chat_container = st.container()
    with chat_container:
        if not st.session_state["chat_messages"]:
            st.info("Hello! I'm your Deprex Companion. How are you feeling today? You can share anything on your mind.")
        for msg in st.session_state["chat_messages"]:
            role = msg["role"]
            content = msg["content"]
            if role == "user":
                st.markdown(f'<div class="chat-bubble-user">{content}</div>', unsafe_allow_html=True)
            else:
                is_crisis = "988" in content and ("suicide" in content.lower() or "crisis" in content.lower())
                bubble_class = "chat-bubble-companion"
                if is_crisis:
                    st.markdown(
                        f'<div class="chat-bubble-companion" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.12);"><strong>🛡️ Crisis Guardrail:</strong><br/>{content}</div>',
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(f'<div class="{bubble_class}"><strong>Companion 💙</strong><br/>{content}</div>', unsafe_allow_html=True)

    # Chat Input
    prompt = st.chat_input("Share how you are feeling or ask for grounding support...")
    if prompt:
        # Append user message locally
        st.session_state["chat_messages"].append({"role": "user", "content": prompt})
        with st.spinner("Companion is reflecting..."):
            try:
                res = api.send_chat(prompt)
                st.session_state["chat_messages"].append(
                    {"role": "assistant", "content": res["reply"], "createdAt": res.get("createdAt")}
                )
                st.rerun()
            except Exception as e:
                st.error(f"Could not deliver message: {str(e)}")


# ─── View 2: PHQ-9 Assessment ──────────────────────────────────────────────────
elif page == "📊 PHQ-9 Assessment":
    st.markdown(
        """
        <div class="dx-header" style="text-align: left; padding: 10px 0 15px 0;">
            <div class="dx-title" style="font-size: 2.2rem;">Standardized PHQ-9 Assessment</div>
            <div class="dx-subtitle">Validated 9-question clinical screening for depression risk and severity classification.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.expander("ℹ️ How scoring works & Clinical Privacy", expanded=False):
        st.write(
            "The Patient Health Questionnaire (PHQ-9) is a standardized psychometric tool. "
            "Scores range from 0 to 27 across five clinical Severity Bands: "
            "Minimal (0-4), Mild (5-9), Moderate (10-14), Moderately Severe (15-19), and Severe (20-27). "
            "All invariant classifications are calculated server-side."
        )

    with st.form("phq9_form"):
        st.write("Over the **last 2 weeks**, how often have you been bothered by any of the following problems?")
        responses = []
        for i, q in enumerate(PHQ9_QUESTIONS):
            st.markdown(f"**{q}**")
            ans = st.radio(
                label=f"q_{i}",
                options=[0, 1, 2, 3],
                format_func=lambda x: [o[1] for o in PHQ9_OPTIONS if o[0] == x][0],
                horizontal=True,
                key=f"phq9_radio_{i}",
                label_visibility="collapsed",
            )
            responses.append(ans)
            st.markdown("<div style='margin-bottom: 12px;'></div>", unsafe_allow_html=True)

        submitted = st.form_submit_button("Submit Assessment & Calculate Risk", use_container_width=True)

    if submitted:
        with st.spinner("Evaluating clinical invariants on server..."):
            try:
                res = api.submit_assessment(responses)
                st.success("Assessment securely recorded!")

                score = res["score"]
                severity = res["severity"]
                risk = res["risk"]
                insight = res["coping_insight"]

                badge_class = f"badge-{severity.lower().replace(' ', '-')}"
                st.markdown(
                    f"""
                    <div class="dx-card" style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="margin: 0; color: #fff;">Assessment Results</h3>
                            <span class="{badge_class}">Severity: {severity}</span>
                        </div>
                        <p style="font-size: 1.1rem; color: #e2e8f0;">
                            <strong>Total Score:</strong> {score} / 27 &nbsp;&nbsp;|&nbsp;&nbsp; 
                            <strong>Clinical Risk Posture:</strong> {int(risk * 100)}%
                        </p>
                        <div style="background: rgba(255,255,255,0.04); border-left: 4px solid #8b5cf6; padding: 12px 16px; border-radius: 8px; margin-top: 15px;">
                            <strong>Reflection & Coping Guidance:</strong><br/>
                            <span style="color: #cbd5e1;">{insight}</span>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            except Exception as e:
                st.error(f"Failed to record assessment: {str(e)}")

    # Latest summary section
    latest = api.get_latest_assessment()
    if latest:
        st.markdown("---")
        st.markdown("#### Most Recent Recorded Baseline")
        st.markdown(
            f"""
            <div class="dx-card">
                <strong>Recorded:</strong> {latest.get('createdAt', 'Recently')} &nbsp;|&nbsp;
                <strong>Score:</strong> {latest.get('score')} / 27 &nbsp;|&nbsp;
                <strong>Risk:</strong> {int(latest.get('risk', 0) * 100)}%
            </div>
            """,
            unsafe_allow_html=True,
        )


# ─── View 3: Reflective Journal ────────────────────────────────────────────────
elif page == "📖 Reflective Journal":
    st.markdown(
        """
        <div class="dx-header" style="text-align: left; padding: 10px 0 15px 0;">
            <div class="dx-title" style="font-size: 2.2rem;">Reflective Journal</div>
            <div class="dx-subtitle">Express your daily thoughts freely. Your entries are analyzed for emotional valence and sentiment trends.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.form("journal_form"):
        content = st.text_area(
            "What is on your mind today?",
            placeholder="Write freely... e.g., 'Today I felt calm after a walk in the park, but work felt a bit overwhelming in the afternoon.'",
            height=140,
        )
        saved = st.form_submit_button("Save Journal Reflection", use_container_width=True)

    if saved:
        if not content.strip():
            st.error("Please write something before saving.")
        else:
            with st.spinner("Saving reflection and evaluating sentiment..."):
                try:
                    res = api.save_journal(content.strip())
                    st.success("Journal saved successfully!")
                    sentiment_score = res.get("sentiment", 0.0)
                    label = res.get("label", "neutral").capitalize()

                    col_a, col_b = st.columns(2)
                    with col_a:
                        st.metric("Sentiment Classification", label)
                    with col_b:
                        st.metric("Valence Score", f"{sentiment_score:+.2f}")
                except Exception as e:
                    st.error(f"Could not save journal: {str(e)}")

    st.markdown("---")
    st.markdown("#### Past Reflections")
    journals = api.get_journals()
    if not journals:
        st.info("No journal reflections recorded yet. Write your first reflection above!")
    else:
        for j in journals[:10]:
            created = j.get("created_at") or j.get("createdAt") or "Recent"
            label = j.get("label", "neutral").capitalize()
            score = j.get("sentiment", 0.0)
            st.markdown(
                f"""
                <div class="dx-card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">{created}</span>
                        <span style="color: #c084fc; font-size: 0.85rem; font-weight: 600;">{label} ({score:+.2f})</span>
                    </div>
                    <div style="color: #f1f5f9; font-size: 0.95rem; line-height: 1.5;">{j.get('content')}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ─── View 4: Relief & Grounding ────────────────────────────────────────────────
elif page == "🌬️ Relief & Grounding":
    st.markdown(
        """
        <div class="dx-header" style="text-align: left; padding: 10px 0 15px 0;">
            <div class="dx-title" style="font-size: 2.2rem;">Relief & Grounding Protocol</div>
            <div class="dx-subtitle">Real-time breathing regulation and interest-curated wellness tools.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Interactive Animated Breathing Box
    st.markdown(
        """
        <div class="dx-card">
            <h3 style="color: #fff; text-align: center; margin-bottom: 5px;">4-4-4-4 Box Breathing</h3>
            <p style="color: rgba(255,255,255,0.6); text-align: center; font-size: 0.9rem; margin-bottom: 20px;">
                Synchronize your breath with the glowing orb: Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s)
            </p>
            <div class="breathing-container">
                <div class="breathing-circle">Breathe</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Grounding Techniques
    st.markdown("### Quick Grounding Techniques")
    for tech in GROUNDING_TECHNIQUES:
        with st.container():
            st.markdown(
                f"""
                <div class="dx-card" style="padding: 16px 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <span style="font-size: 28px;">{tech['icon']}</span>
                            <div>
                                <strong style="color: #fff; font-size: 1.05rem;">{tech['title']}</strong><br/>
                                <span style="color: rgba(255,255,255,0.65); font-size: 0.9rem;">{tech['desc']}</span>
                            </div>
                        </div>
                        <span style="color: #a855f7; font-weight: 600; font-size: 0.85rem;">{tech['time']}</span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown("---")
    st.markdown("### Tailored Interest Resources")
    user_interests = user.get("interests") or ["Chess", "Mindfulness & Yoga", "Music & Audio"]
    for interest in user_interests:
        resources = INTEREST_CATALOG.get(interest, [])
        if resources:
            st.markdown(f"#### {interest}")
            cols = st.columns(len(resources))
            for idx, item in enumerate(resources):
                with cols[idx]:
                    st.markdown(
                        f"""
                        <div class="dx-card" style="height: 180px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <span style="font-size: 28px;">{item['icon']}</span>
                                <strong style="display: block; color: #fff; margin-top: 6px;">{item['title']}</strong>
                                <span style="font-size: 0.82rem; color: rgba(255,255,255,0.6);">{item['desc']}</span>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                    st.link_button(f"Open {item['title']}", item["url"], use_container_width=True)


# ─── View 5: Profile & Interests ───────────────────────────────────────────────
elif page == "👤 Profile & Interests":
    st.markdown(
        """
        <div class="dx-header" style="text-align: left; padding: 10px 0 15px 0;">
            <div class="dx-title" style="font-size: 2.2rem;">Profile & Wellness Preferences</div>
            <div class="dx-subtitle">Customize the activities and grounding topics your AI Companion weaves into support.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        f"""
        <div class="dx-card">
            <h3 style="color: #fff; margin-bottom: 10px;">User Account</h3>
            <p style="color: #cbd5e1; margin: 0;"><strong>Name:</strong> {user.get('name')}</p>
            <p style="color: #cbd5e1; margin: 4px 0 0 0;"><strong>Email:</strong> {user.get('email')}</p>
            <p style="color: #cbd5e1; margin: 4px 0 0 0;"><strong>Account Status:</strong> Active</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("### Update Preferred Interests")
    all_options = list(INTEREST_CATALOG.keys())
    current_interests = user.get("interests") or ["Chess"]
    valid_defaults = [i for i in current_interests if i in all_options]

    selected_interests = st.multiselect(
        "Select interests that help you relax or re-center:",
        options=all_options,
        default=valid_defaults,
    )

    if st.button("Save Preferences", use_container_width=True):
        try:
            api.update_interests(selected_interests, user.get("sub_interests") or {})
            st.session_state["current_user"]["interests"] = selected_interests
            st.success("Your wellness preferences have been updated!")
        except Exception as e:
            st.error(f"Failed to update preferences: {str(e)}")
