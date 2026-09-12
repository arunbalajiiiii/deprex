// Prototype: Three variants of the Dashboard page, switchable via ?variant=, on the existing / route.
// Rule: Throwaway code to answer "What should this look like?"
// Switcher: Floating bottom bar with arrows, keyboard navigation (← / →), and URL synchronization.

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Helper functions for scoring & labels
function getRiskDetails(score) {
  if (score < 0.33) return { label: "Low Risk", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" };
  if (score < 0.66) return { label: "Moderate Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" };
  return { label: "High Risk", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" };
}

function getSeverity(score) {
  if (!score && score !== 0) return { label: "Not Assessed", color: "rgba(255,255,255,0.4)" };
  const pct = score / 27;
  if (pct < 0.2) return { label: "Minimal (Doing Well)", color: "#22c55e" };
  if (pct < 0.4) return { label: "Mild Concern", color: "#84cc16" };
  if (pct < 0.6) return { label: "Moderate Concern", color: "#f59e0b" };
  if (pct < 0.8) return { label: "Moderately Severe", color: "#f97316" };
  return { label: "Severe Concern", color: "#ef4444" };
}

const MOCK_FALLBACK_TREND = [
  { date: "Day 1", mood: 48, risk: 42 },
  { date: "Day 2", mood: 52, risk: 38 },
  { date: "Day 3", mood: 58, risk: 35 },
  { date: "Day 4", mood: 64, risk: 30 },
  { date: "Day 5", mood: 60, risk: 32 },
  { date: "Day 6", mood: 70, risk: 26 },
  { date: "Today", mood: 75, risk: 22 },
];

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT A: "Bento Sanctuary" (Asymmetric Grid & Peaceful Harmony)
// ─────────────────────────────────────────────────────────────────────────────
export function VariantA({ user, risk, journals, assessHistory, reliefEvents, chatEvents, setTab }) {
  const riskInfo = getRiskDetails(risk);
  const latestAssess = assessHistory[assessHistory.length - 1];
  const severity = latestAssess ? getSeverity(latestAssess.score) : null;
  const recentJournal = journals[0];
  const totalActivities = (reliefEvents || []).length;

  return (
    <div style={{ padding: "28px 34px", overflowY: "auto", height: "100vh", paddingBottom: "100px" }}>
      {/* 1. Sanctuary Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(16, 185, 129, 0.06) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.25)",
        borderRadius: "20px",
        padding: "24px 28px",
        marginBottom: "24px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "18px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "24px" }}>🌸</span>
            <span style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Your Daily Sanctuary</span>
          </div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: "800", margin: 0 }}>
            Welcome back, {user.name}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "6px", maxWidth: "480px", lineHeight: "1.4" }}>
            "You don't have to control your thoughts. You just have to stop letting them control you."
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setTab("relief")}
            style={{
              padding: "11px 20px",
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)"
            }}
          >
            🌿 Begin Grounding Session
          </button>
        </div>
      </div>

      {/* 2. Asymmetric Bento Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: "20px"
      }}>
        {/* Bento Tile 1: Emotional Weather Trajectory (8 Columns) */}
        <div style={{
          gridColumn: "span 8",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "20px",
          backdropFilter: "blur(12px)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>📈 Emotional Weather Trajectory</h3>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "3px" }}>Real-time balance between Mood Vitality & Risk</p>
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
              <span style={{ color: "#a78bfa", fontWeight: "600" }}>● Mood (0-100)</span>
              <span style={{ color: "#f87171", fontWeight: "600" }}>● Risk %</span>
            </div>
          </div>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_FALLBACK_TREND}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "rgba(10,8,25,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#moodGrad)" />
                <Line type="monotone" dataKey="risk" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento Tile 2: Clinical Posture & PHQ-9 (4 Columns) */}
        <div style={{
          gridColumn: "span 4",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${riskInfo.border}`,
          borderRadius: "18px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backdropFilter: "blur(12px)"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "600" }}>Clinical Posture</span>
              <span style={{ background: riskInfo.bg, color: riskInfo.color, padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "800", border: `1px solid ${riskInfo.border}` }}>
                {riskInfo.label}
              </span>
            </div>
            <div style={{ color: "white", fontSize: "36px", fontWeight: "900", lineHeight: 1 }}>
              {Math.round(risk * 100)}<span style={{ fontSize: "18px", color: "rgba(255,255,255,0.4)" }}>%</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "6px" }}>
              Composite wellness index derived from PHQ-9 screening, sentiment delta, and grounding frequency.
            </p>
            {severity && (
              <div style={{ marginTop: "14px", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", textTransform: "uppercase" }}>Latest PHQ-9</div>
                <div style={{ color: severity.color, fontSize: "13px", fontWeight: "700", marginTop: "2px" }}>
                  Score {latestAssess.score}/27 • {severity.label}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setTab("assess")}
            style={{
              marginTop: "16px",
              padding: "10px",
              width: "100%",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "10px",
              color: "#c4b5fd",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            {latestAssess ? "Retake PHQ-9 Screening" : "Take Baseline Screening"}
          </button>
        </div>

        {/* Bento Tile 3: Recent Reflection (6 Columns) */}
        <div style={{
          gridColumn: "span 6",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ color: "white", fontSize: "14px", fontWeight: "700", margin: 0 }}>📝 Latest Reflection</h3>
            <button onClick={() => setTab("journal")} style={{ background: "none", border: "none", color: "#8b5cf6", fontSize: "11px", cursor: "pointer", fontWeight: "700" }}>
              + New Entry ↗
            </button>
          </div>
          {recentJournal ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{new Date(recentJournal.date).toLocaleDateString()}</span>
                <span style={{ color: recentJournal.sentiment?.color || "#22c55e", fontSize: "10px", fontWeight: "700" }}>{recentJournal.sentiment?.label || "Reflected"}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: "1.5", margin: 0, fontStyle: "italic" }}>
                "{(recentJournal.text || recentJournal.content || "").slice(0, 140)}…"
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
              No journal reflections logged yet today.
            </div>
          )}
        </div>

        {/* Bento Tile 4: Crisis Support & Grounding Anchor (6 Columns) */}
        <div style={{
          gridColumn: "span 6",
          background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(139,92,246,0.05) 100%)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "18px",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ color: "#f87171", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Immediate Crisis Guardrail</div>
            <h4 style={{ color: "white", fontSize: "14px", fontWeight: "700", marginTop: "2px", marginBottom: "4px" }}>Need immediate support?</h4>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", margin: 0 }}>Call or text 988 anytime. Free, confidential, 24/7 lifeline.</p>
          </div>
          <a
            href="tel:988"
            style={{
              padding: "10px 18px",
              background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "10px",
              color: "#fca5a5",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: "800",
              flexShrink: 0
            }}
          >
            📞 988 Lifeline
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT B: "Clinical Command & Biometric Telemetry" (Split-Pane Data & Action)
// ─────────────────────────────────────────────────────────────────────────────
export function VariantB({ user, risk, journals, assessHistory, reliefEvents, chatEvents, setTab }) {
  const riskInfo = getRiskDetails(risk);
  const latestAssess = assessHistory[assessHistory.length - 1];
  const [quickMessage, setQuickMessage] = useState("");

  const handleQuickSend = () => {
    if (!quickMessage.trim()) return;
    setTab("chat");
  };

  return (
    <div style={{ padding: "26px 30px", overflowY: "auto", height: "100vh", paddingBottom: "100px" }}>
      {/* Top Telemetry Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
            <h1 style={{ color: "white", fontSize: "18px", fontWeight: "800", margin: 0 }}>Clinical Telemetry & Command Center</h1>
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "3px" }}>Patient ID: {user.email} • Active Real-Time Invariant Feed</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "4px 10px", color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>
            Active Models: Gemini 2.5 + PHQ-9 Scoring
          </span>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
        {/* Left Telemetry Column (38%) */}
        <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Risk Metric Card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${riskInfo.border}`, borderRadius: "14px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "700" }}>COMPOSITE RISK INDEX</span>
              <span style={{ color: riskInfo.color, fontWeight: "800", fontSize: "12px" }}>{riskInfo.label}</span>
            </div>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "white", margin: "8px 0" }}>
              {(risk * 100).toFixed(1)}%
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${risk * 100}%`, height: "100%", background: riskInfo.color, transition: "width 0.4s ease" }} />
            </div>
          </div>

          {/* Subscore Signal Diagnostic Stack */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px" }}>
            <h4 style={{ color: "white", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
              Signal Invariant Breakdown
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>PHQ-9 Psychometric (55% weight)</span>
                  <span style={{ color: "white", fontWeight: "700" }}>{latestAssess ? `${latestAssess.score}/27` : "None"}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", height: "4px", borderRadius: "2px" }}>
                  <div style={{ width: `${latestAssess ? (latestAssess.score / 27) * 100 : 0}%`, height: "100%", background: "#8b5cf6" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Journal Sentiment Inversion (35% weight)</span>
                  <span style={{ color: "#22c55e", fontWeight: "700" }}>{journals.length ? "Active" : "Baseline"}</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", height: "4px", borderRadius: "2px" }}>
                  <div style={{ width: "65%", height: "100%", background: "#22c55e" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Grounding Relief Bonus</span>
                  <span style={{ color: "#38bdf8", fontWeight: "700" }}>+{(reliefEvents || []).length} completed</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", height: "4px", borderRadius: "2px" }}>
                  <div style={{ width: `${Math.min(100, (reliefEvents || []).length * 15)}%`, height: "100%", background: "#38bdf8" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action & Intervention Deck (62%) */}
        <div style={{ flex: "2 1 450px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Instant AI Check-In Deck */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(37,99,235,0.08) 100%)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "14px",
            padding: "20px"
          }}>
            <h3 style={{ color: "white", fontSize: "15px", fontWeight: "800", marginBottom: "6px" }}>
              ⚡ Instant Companion Intervention
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "14px" }}>
              Type your raw thoughts right here to begin an immediate de-escalation check-in.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={quickMessage}
                onChange={e => setQuickMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleQuickSend()}
                placeholder="What is feeling heaviest right now?"
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "9px",
                  color: "white",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
              <button
                onClick={handleQuickSend}
                style={{
                  padding: "11px 18px",
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  border: "none",
                  borderRadius: "9px",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Send to Companion ↗
              </button>
            </div>
          </div>

          {/* Intervention Tool Stack */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div
              onClick={() => setTab("relief")}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "all 0.15s" }}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>🌬️</div>
              <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>4-4-4-4 Box Breathing</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px" }}>Vagus nerve somatic down-regulation</div>
            </div>

            <div
              onClick={() => setTab("assess")}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", cursor: "pointer", transition: "all 0.15s" }}
            >
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>📋</div>
              <div style={{ color: "white", fontSize: "13px", fontWeight: "700" }}>PHQ-9 Assessment</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px" }}>Standardized 9-question psychometric</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT C: "Reflective Journey & Chronicle" (Narrative Timeline & Companion)
// ─────────────────────────────────────────────────────────────────────────────
export function VariantC({ user, risk, journals, assessHistory, reliefEvents, chatEvents, setTab }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const MOOD_OPTIONS = [
    { emoji: "✨", label: "Radiant", color: "#fbbf24" },
    { emoji: "🌿", label: "Peaceful", color: "#4ade80" },
    { emoji: "☁️", label: "Foggy", color: "#94a3b8" },
    { emoji: "🌧️", label: "Heavy", color: "#60a5fa" },
    { emoji: "🌪️", label: "Overwhelmed", color: "#f87171" },
  ];

  return (
    <div style={{ padding: "34px 20px", overflowY: "auto", height: "100vh", paddingBottom: "110px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Warm Narrative Greeting */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ fontSize: "36px" }}>🌱</span>
          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "800", marginTop: "8px" }}>
            How is your heart feeling today, {user.name}?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: "4px" }}>
            Take a breath. No performance, no judgments. Just honest presence.
          </p>

          {/* Interactive Mood Selector */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.label}
                onClick={() => setSelectedMood(m.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 16px",
                  background: selectedMood === m.label ? `${m.color}25` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedMood === m.label ? m.color : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "999px",
                  color: selectedMood === m.label ? m.color : "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
          {selectedMood && (
            <div style={{ marginTop: "12px", color: "#c4b5fd", fontSize: "12px", fontStyle: "italic" }}>
              Acknowledged: You are feeling <strong>{selectedMood}</strong>. Your feelings are valid and held.
            </div>
          )}
        </div>

        {/* Narrative Milestone Stream */}
        <div style={{ position: "relative", paddingLeft: "30px", borderLeft: "2px dashed rgba(139, 92, 246, 0.25)", marginLeft: "14px" }}>
          {/* Milestone 1: Daily Somatic Anchor */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 10px #8b5cf6" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#c4b5fd", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Somatic Anchor</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Daily practice</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>4-4-4-4 Box Breathing Reset</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                Soothe your autonomic nervous system with 4 cycles of box breathing.
              </p>
              <button
                onClick={() => setTab("relief")}
                style={{ marginTop: "8px", padding: "7px 14px", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "8px", color: "#c4b5fd", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                Launch Exercise ↗
              </button>
            </div>
          </div>

          {/* Milestone 2: Journal Chronicle */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#93c5fd", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Reflective Space</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Writing</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Your Daily Journal</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                Writing untangles difficult knots in the mind. Record a short moment from your day.
              </p>
              <button
                onClick={() => setTab("journal")}
                style={{ marginTop: "8px", padding: "7px 14px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "8px", color: "#93c5fd", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                Open Journal ↗
              </button>
            </div>
          </div>

          {/* Milestone 3: Clinical Care Point */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#6ee7b7", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Clinical Baseline</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>PHQ-9 screening</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Mood & Risk Posture</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                Keep your longitudinal trends clear so your care team or support circle can help you best.
              </p>
              <button
                onClick={() => setTab("assess")}
                style={{ marginTop: "8px", padding: "7px 14px", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "8px", color: "#6ee7b7", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                Check PHQ-9 Status ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTOTYPE SWITCHER (Floating Bottom Bar conforming to UI.md)
// ─────────────────────────────────────────────────────────────────────────────
export function PrototypeSwitcher({ variants, current, onChange }) {
  const currentIndex = variants.findIndex(v => v.key === current);

  const prev = () => {
    const nextIdx = (currentIndex - 1 + variants.length) % variants.length;
    onChange(variants[nextIdx].key);
  };

  const next = () => {
    const nextIdx = (currentIndex + 1) % variants.length;
    onChange(variants[nextIdx].key);
  };

  // Keyboard navigation listener (← and → arrow keys, ignored in input/textarea)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, variants]);

  const curObj = variants[currentIndex] || variants[0];

  return (
    <div style={{
      position: "fixed",
      bottom: "22px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99999,
      background: "rgba(15, 12, 30, 0.94)",
      border: "1px solid rgba(139, 92, 246, 0.45)",
      borderRadius: "999px",
      padding: "6px 14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      boxShadow: "0 10px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.25)",
      backdropFilter: "blur(16px)"
    }}>
      <button
        onClick={prev}
        title="Previous variant (← key)"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          color: "white",
          cursor: "pointer",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s"
        }}
      >
        ◀
      </button>

      <div style={{ textAlign: "center", minWidth: "220px" }}>
        <div style={{ color: "#a855f7", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
          UI Prototype Evaluation
        </div>
        <div style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>
          Variant {curObj.key}: <span style={{ color: "#c4b5fd" }}>{curObj.name}</span>
        </div>
      </div>

      <button
        onClick={next}
        title="Next variant (→ key)"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          color: "white",
          cursor: "pointer",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s"
        }}
      >
        ▶
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD PROTOTYPE HOST (Sub-shape A)
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPrototypes(props) {
  const VARIANTS = [
    { key: "A", name: "Bento Sanctuary" },
    { key: "B", name: "Clinical Command Center" },
    { key: "C", name: "Reflective Journey" },
  ];

  const getInitialVariant = () => {
    try {
      const urlParam = new URLSearchParams(window.location.search).get("variant");
      if (urlParam && ["A", "B", "C"].includes(urlParam.toUpperCase())) {
        return urlParam.toUpperCase();
      }
    } catch {}
    return "A";
  };

  const [currentVariant, setCurrentVariant] = useState(getInitialVariant);

  const handleVariantChange = (newKey) => {
    setCurrentVariant(newKey);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", newKey);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {currentVariant === "A" && <VariantA {...props} />}
      {currentVariant === "B" && <VariantB {...props} />}
      {currentVariant === "C" && <VariantC {...props} />}
      <PrototypeSwitcher
        variants={VARIANTS}
        current={currentVariant}
        onChange={handleVariantChange}
      />
    </div>
  );
}
