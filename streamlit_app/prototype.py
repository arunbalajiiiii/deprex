"""
Three radically different UI prototype variants of the Deprex dashboard.
Switchable via ?variant= URL parameter and floating bottom bar switcher.

- Variant A: Bento Sanctuary (Minimalist, Breathing & Wellness centric bento grid)
- Variant B: Dual-Pane Command Center (Dedicated Companion Room + Live Clinical Telemetry)
- Variant C: Reflective Journey Feed (Editorial, Storyline & Journal-first timeline)
"""

import streamlit as st
from streamlit_app.api_client import api
from streamlit_app.catalog import GROUNDING_TECHNIQUES, INTEREST_CATALOG


def render_prototype_switcher():
    current_variant = st.query_params.get("variant", "A").upper()
    if current_variant not in ["A", "B", "C"]:
        current_variant = "A"

    variants = [
        ("A", "Variant A: Bento Sanctuary 🧘"),
        ("B", "Variant B: Dual-Pane Command 🧠"),
        ("C", "Variant C: Reflective Journey 📖"),
    ]
    curr_idx = [v[0] for v in variants].index(current_variant)

    st.markdown(
        """
        <style>
        .proto-pill {
            position: fixed;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            background: rgba(15, 12, 34, 0.92);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(168, 85, 247, 0.5);
            box-shadow: 0 10px 35px rgba(0,0,0,0.7), 0 0 25px rgba(139, 92, 246, 0.35);
            border-radius: 9999px;
            padding: 8px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    # Streamlit bottom floating bar
    with st.container():
        cols = st.columns([1, 4, 1])
        with cols[1]:
            st.markdown('<div class="proto-pill">', unsafe_allow_html=True)
            subcol1, subcol2, subcol3 = st.columns([1, 3, 1])
            with subcol1:
                prev_var = variants[(curr_idx - 1) % len(variants)][0]
                if st.button("◀ Prev", key="btn_prev_var", use_container_width=True):
                    st.query_params["variant"] = prev_var
                    st.rerun()
            with subcol2:
                label = variants[curr_idx][1]
                st.markdown(f"<div style='text-align:center; color:#c084fc; font-weight:700; font-size:0.95rem; padding-top:6px;'>{label}</div>", unsafe_allow_html=True)
            with subcol3:
                next_var = variants[(curr_idx + 1) % len(variants)][0]
                if st.button("Next ▶", key="btn_next_var", use_container_width=True):
                    st.query_params["variant"] = next_var
                    st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)

    return current_variant


# ─── VARIANT A: BENTO SANCTUARY ────────────────────────────────────────────────
def render_variant_a(user: dict):
    st.markdown(
        """
        <div style="text-align: center; margin-bottom: 25px;">
            <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; color: #a855f7; font-weight: 700;">Variant A • Bento Sanctuary</span>
            <h1 style="font-size: 2.8rem; font-weight: 800; margin: 4px 0 6px 0; background: linear-gradient(135deg, #c084fc 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Peaceful Space, {name}
            </h1>
            <p style="color: rgba(255,255,255,0.6); font-size: 1.05rem;">Take a slow breath. Your sanctuary is here to help you center and recover.</p>
        </div>
        """.format(name=user.get("name", "Friend")),
        unsafe_allow_html=True,
    )

    # Top Hero: Breathing Orb Centerpiece
    st.markdown(
        """
        <div class="dx-card" style="text-align: center; padding: 30px; background: radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.12) 0%, rgba(15, 12, 30, 0.6) 100%);">
            <h3 style="color: #fff; margin-bottom: 6px;">4-4-4-4 Box Breathing Regulation</h3>
            <p style="color: rgba(255,255,255,0.55); font-size: 0.9rem; margin-bottom: 20px;">Synchronize: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s</p>
            <div class="breathing-container" style="padding: 10px 0;">
                <div class="breathing-circle">Inhale</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Bento Grid: 3 columns
    c1, c2, c3 = st.columns([1.2, 1, 1])

    with c1:
        st.markdown(
            """
            <div class="dx-card" style="height: 100%;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span style="font-size: 24px;">💬</span>
                    <strong style="color: #fff; font-size: 1.15rem;">Companion Check-in</strong>
                </div>
                <p style="color: rgba(255,255,255,0.65); font-size: 0.9rem; line-height: 1.5;">
                    "I noticed you've been working hard today. What is sitting heaviest on your chest?"
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        quick_msg = st.text_input("Message Companion...", placeholder="I'm feeling a little anxious...", key="var_a_chat")
        if st.button("Send to Companion", key="btn_a_send", use_container_width=True) and quick_msg:
            with st.spinner("Reflecting..."):
                res = api.send_chat(quick_msg)
                st.info(f"Companion: {res.get('reply')}")

    with c2:
        st.markdown(
            """
            <div class="dx-card" style="height: 100%;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span style="font-size: 24px;">🌿</span>
                    <strong style="color: #fff; font-size: 1.15rem;">Instant Grounding</strong>
                </div>
                <div style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6;">
                    <strong>5-4-3-2-1 Sensory:</strong><br/>
                    • 5 things you can see<br/>
                    • 4 things you can touch<br/>
                    • 3 sounds around you<br/>
                    • 2 scents in the air<br/>
                    • 1 deep grateful breath
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        latest = api.get_latest_assessment()
        risk_pct = int(latest.get("risk", 0.15) * 100) if latest else 15
        st.markdown(
            f"""
            <div class="dx-card" style="height: 100%;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <span style="font-size: 24px;">📊</span>
                    <strong style="color: #fff; font-size: 1.15rem;">Wellbeing State</strong>
                </div>
                <div style="margin: 15px 0;">
                    <span style="font-size: 2.2rem; font-weight: 800; color: #38bdf8;">{100 - risk_pct}%</span>
                    <span style="color: rgba(255,255,255,0.5); font-size: 0.85rem; display: block;">Emotional Equilibrium</span>
                </div>
                <span class="badge-minimal">Status: Stable</span>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ─── VARIANT B: DUAL-PANE COMMAND CENTER ──────────────────────────────────────
def render_variant_b(user: dict):
    st.markdown(
        """
        <div style="margin-bottom: 18px;">
            <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #38bdf8; font-weight: 700;">Variant B • Dual-Pane Command Center</span>
            <h2 style="margin: 2px 0 0 0; color: #fff; font-weight: 800;">Mental Health Coping Workspace</h2>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col_chat, col_telemetry = st.columns([1.5, 1], gap="medium")

    with col_chat:
        st.markdown('<div class="dx-card" style="padding: 18px;">', unsafe_allow_html=True)
        st.markdown(
            """
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 14px;">
                <div>
                    <strong style="color: #fff; font-size: 1.1rem;">AI Companion Stream</strong><br/>
                    <span style="font-size: 0.8rem; color: #4ade80;">● Active • 988 Safety Filter Armed</span>
                </div>
                <span class="badge-minimal">Live Session</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        history = api.get_chat_history()[-6:] if api.token else []
        if not history:
            history = [
                {"role": "assistant", "content": f"Welcome, {user.get('name')}. I am listening. Take your time to express whatever you are feeling."}
            ]

        for m in history:
            if m["role"] == "user":
                st.markdown(f'<div class="chat-bubble-user">{m["content"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="chat-bubble-companion"><strong>Companion:</strong> {m["content"]}</div>', unsafe_allow_html=True)

        user_input = st.chat_input("Enter your message to the companion...", key="var_b_chat_input")
        if user_input:
            with st.spinner("Streaming response..."):
                api.send_chat(user_input)
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)

    with col_telemetry:
        st.markdown(
            """
            <div class="dx-card">
                <h4 style="color: #fff; margin-top: 0;">Clinical Telemetry</h4>
                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">Depression Risk Severity</span>
                        <span style="color: #60a5fa; font-weight: 700;">Mild (6/27)</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;">
                        <div style="width: 22%; height: 100%; background: linear-gradient(90deg, #22c55e, #3b82f6);"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px; text-align: center;">
                        <span style="font-size: 1.4rem; font-weight: 700; color: #4ade80;">+0.42</span>
                        <span style="display: block; font-size: 0.75rem; color: rgba(255,255,255,0.5);">Sentiment Valence</span>
                    </div>
                    <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 10px; text-align: center;">
                        <span style="font-size: 1.4rem; font-weight: 700; color: #a855f7;">4</span>
                        <span style="display: block; font-size: 0.75rem; color: rgba(255,255,255,0.5);">Grounding Breaks</span>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            """
            <div class="dx-crisis-banner">
                <span style="font-size: 24px;">🛡️</span>
                <div>
                    <strong style="color: #fca5a5; font-size: 0.9rem;">24/7 Lifeline Intervention</strong>
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.8rem; margin: 2px 0 0 0;">
                        Direct hotline <strong>988</strong> is connected. Free, confidential, immediate.
                    </p>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ─── VARIANT C: JOURNAL-FIRST JOURNEY ──────────────────────────────────────────
def render_variant_c(user: dict):
    _, center_col, _ = st.columns([1, 2.2, 1])

    with center_col:
        st.markdown(
            """
            <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #ec4899; font-weight: 700;">Variant C • Reflective Journey</span>
                <h1 style="font-size: 2.6rem; font-weight: 800; color: #fff; margin: 4px 0;">Today's Reflection</h1>
                <p style="color: rgba(255,255,255,0.55); font-size: 1rem;">Pour your honest thoughts into the timeline. We help you notice patterns in how you feel.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Journal prompt box
        st.markdown('<div class="dx-card" style="border-color: rgba(236, 72, 153, 0.3);">', unsafe_allow_html=True)
        st.markdown("<strong style='color:#f472b6; font-size:1.05rem;'>Prompt of the Day:</strong> <span style='color:#f1f5f9;'>What is one small thing that gave you peace recently, however brief?</span>", unsafe_allow_html=True)
        reflection_text = st.text_area("Your Entry", placeholder="Write freely without editing yourself...", height=120, label_visibility="collapsed")
        
        c_mood1, c_mood2, c_mood3, c_mood4 = st.columns(4)
        with c_mood1:
            st.button("😌 Calm", use_container_width=True)
        with c_mood2:
            st.button("⚡ Anxious", use_container_width=True)
        with c_mood3:
            st.button("🌧️ Heavy", use_container_width=True)
        with c_mood4:
            st.button("🌿 Hopeful", use_container_width=True)

        if st.button("Publish to Private Journey", use_container_width=True):
            if reflection_text:
                api.save_journal(reflection_text)
                st.success("Your reflection has been added to your journey!")
                st.rerun()

        st.markdown("</div>", unsafe_allow_html=True)

        # Timeline cards
        st.markdown("<h3 style='color:#fff; margin: 25px 0 15px 0;'>Timeline Stream</h3>", unsafe_allow_html=True)
        journals = api.get_journals()[:3]
        if not journals:
            journals = [
                {"content": "Morning walk under the trees. The cool air made my head feel a lot clearer.", "label": "Positive", "sentiment": 0.65, "createdAt": "Today, 9:30 AM"},
                {"content": "Felt a sudden wave of fatigue after lunch, took 4 minutes of box breathing.", "label": "Neutral", "sentiment": 0.1, "createdAt": "Yesterday, 2:15 PM"},
            ]

        for item in journals:
            st.markdown(
                f"""
                <div class="dx-card" style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #ec4899; font-size: 0.85rem; font-weight: 600;">✦ Reflection</span>
                        <span style="color: rgba(255,255,255,0.4); font-size: 0.8rem;">{item.get('createdAt', 'Recent')}</span>
                    </div>
                    <div style="color: #f1f5f9; font-size: 0.95rem; line-height: 1.5;">{item.get('content')}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
