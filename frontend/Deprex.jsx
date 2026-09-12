import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";


import {
  QUICK_TECHNIQUES,
  INTEREST_CATEGORIES,
  INTEREST_RESOURCES,
  ASSESSMENT_QUESTIONS,
  MOCK_TREND,
  getPlaceholderHint,
  getCategoryFor,
} from './catalog.js';

import {
  apiFetch,
  getToken,
  setToken,
  clearToken,
  getPersonalisedResources,
  getChatHistory,
  sendChatMessage,
  getWellbeingSummary,
} from './api.js';

function analyzeSentiment(text) {
  const pos=["happy","good","great","wonderful","excited","joy","grateful","calm","peaceful","love","hope","better","improving","smile","laugh","content","motivated","fine","okay","relief","nice","fun","enjoy","proud","relax"];
  const neg=["sad","terrible","awful","hopeless","depressed","worthless","hate","pain","hurt","tired","empty","alone","scared","anxious","overwhelmed","lost","broken","numb","cry","angry","frustrated","stressed","bad","worse","dark","ugly","fail"];
  const lower=text.toLowerCase(); let p=0,n=0;
  pos.forEach(w=>{if(lower.includes(w))p++;}); neg.forEach(w=>{if(lower.includes(w))n++;});
  const s=(p-n)/(p+n||1);
  if(s>0.12) return{label:"Positive",score:Math.min(0.93,0.55+s*0.38),color:"#22c55e"};
  if(s<-0.12) return{label:"Negative",score:Math.max(0.07,0.45+s*0.38),color:"#ef4444"};
  return{label:"Neutral",score:0.5,color:"#f59e0b"};
}
function detectEmotions(text) {
  const lower=text.toLowerCase();
  const map=[[/(anxious|worried|nervous|stress|panic)/,"Anxiety"],[/(sad|cry|tears|grief|miss|loss)/,"Sadness"],
    [/(angry|frustrated|annoyed|mad|irritat)/,"Frustration"],[/(happy|joy|excited|glad|love|grateful)/,"Joy"],
    [/(tired|exhausted|drained|empty|numb)/,"Fatigue"],[/(hope|better|improve|positive|forward)/,"Hope"],
    [/(lonely|isolated|alone|disconnected)/,"Loneliness"]];
  const found=map.filter(([re])=>re.test(lower)).map(([,e])=>e);
  return found.length?found:["Neutral"];
}
function computeRisk(assessScore,sentimentScore,journalCount) {
  const aN=assessScore/(ASSESSMENT_QUESTIONS.length*3);
  const sF=1-sentimentScore; const aF=Math.max(0,1-journalCount*0.08);
  return Math.min(0.97,Math.max(0.03,aN*0.55+sF*0.35+aF*0.1));
}
function riskInfo(score) {
  if(score<0.33) return{label:"Low Risk",color:"#22c55e",bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.3)"};
  if(score<0.66) return{label:"Moderate Risk",color:"#f59e0b",bg:"rgba(245,158,11,0.1)",border:"rgba(245,158,11,0.3)"};
  return{label:"High Risk",color:"#ef4444",bg:"rgba(239,68,68,0.1)",border:"rgba(239,68,68,0.3)"};
}
function severityLabel(score) {
  const pct=score/(ASSESSMENT_QUESTIONS.length*3);
  if(pct<0.2) return{label:"Doing Well",color:"#22c55e"};
  if(pct<0.4) return{label:"Mild Concerns",color:"#84cc16"};
  if(pct<0.6) return{label:"Moderate Concern",color:"#f59e0b"};
  if(pct<0.8) return{label:"Significant Concern",color:"#f97316"};
  return{label:"High Concern",color:"#ef4444"};
}

// ─── Chat Message Analyser ────────────────────────────────────────────────────
// Returns { level: 'neutral'|'mild'|'moderate'|'severe'|'crisis',
//           riskDelta: number (+ve = worsens risk),
//           moodDelta: number (-ve = lowers mood),
//           flags: string[] }
function analyzeChatMessage(text) {
  const t = text.toLowerCase();
  const flags = [];
  let riskDelta = 0;
  let moodDelta = 0;

  // ── Crisis / suicidal signals (highest weight) ──────────────────────────────
  const crisisPatterns = [
    /\b(suicide|suicidal|kill myself|end my life|want to die|don't want to live|no reason to live)\b/,
    /\b(self.?harm|cut myself|hurt myself|overdose|take my own life)\b/,
    /\b(better off dead|everyone.?better without me|goodbye forever|last message)\b/,
  ];
  if (crisisPatterns.some(p => p.test(t))) {
    flags.push("suicidal_ideation");
    riskDelta = 0.28;
    moodDelta = -35;
    return { level: "crisis", riskDelta, moodDelta, flags };
  }

  // ── Severe depressive signals ───────────────────────────────────────────────
  const severePatterns = [
    /\b(completely hopeless|totally worthless|can't go on|give up on everything|nothing matters)\b/,
    /\b(hate myself|hate my life|life is pointless|no point anymore|done with everything)\b/,
    /\b(can't stop crying|breaking down|falling apart|can't function|paralyzed)\b/,
    /\b(severe depression|deeply depressed|extremely anxious|panic attack)\b/,
  ];
  if (severePatterns.some(p => p.test(t))) {
    flags.push("severe_distress");
    riskDelta = 0.14;
    moodDelta = -22;
    return { level: "severe", riskDelta, moodDelta, flags };
  }

  // ── Moderate depressive signals ─────────────────────────────────────────────
  const moderatePatterns = [
    /\b(very sad|really depressed|hopeless|worthless|exhausted|burnt out|burned out)\b/,
    /\b(can't sleep|not eating|no motivation|don't care anymore|lost interest)\b/,
    /\b(crying|feel empty|feel numb|very anxious|really scared|terrified)\b/,
    /\b(overwhelmed|stressed out|can't cope|struggling badly)\b/,
  ];
  const moderateCount = moderatePatterns.filter(p => p.test(t)).length;
  if (moderateCount >= 2) {
    flags.push("moderate_distress");
    riskDelta = 0.07;
    moodDelta = -14;
    return { level: "moderate", riskDelta, moodDelta, flags };
  }

  // ── Mild negative signals ────────────────────────────────────────────────────
  const mildPatterns = [
    /\b(sad|unhappy|lonely|anxious|worried|nervous|down|upset|frustrated|angry|stressed)\b/,
    /\b(bad day|rough day|hard day|difficult|struggling|tired|drained|low energy)\b/,
    /\b(can't focus|not okay|not great|not good|feeling off|feeling weird)\b/,
  ];
  const mildCount = mildPatterns.filter(p => p.test(t)).length;
  if (mildCount >= 2) {
    flags.push("mild_distress");
    riskDelta = 0.03;
    moodDelta = -7;
    return { level: "mild", riskDelta, moodDelta, flags };
  }
  if (mildCount === 1) {
    flags.push("mild_distress");
    riskDelta = 0.015;
    moodDelta = -4;
    return { level: "mild", riskDelta, moodDelta, flags };
  }

  // ── Positive signals (improve graphs) ───────────────────────────────────────
  const positivePatterns = [
    /\b(feeling better|much better|great|wonderful|happy|good today|doing well|feeling good)\b/,
    /\b(motivated|energized|hopeful|optimistic|grateful|thank you|helped|calmer|relieved)\b/,
  ];
  if (positivePatterns.some(p => p.test(t))) {
    flags.push("positive_signal");
    riskDelta = -0.025;
    moodDelta = 8;
    return { level: "positive", riskDelta, moodDelta, flags };
  }

  return { level: "neutral", riskDelta: 0, moodDelta: 0, flags: [] };
}

async function callAI(messages, risk, interests) {
  try {
    const lastMsg = Array.isArray(messages) && messages.length > 0
      ? messages[messages.length - 1].content
      : messages;
    const d = await sendChatMessage(lastMsg);
    return d.reply || "I hear you. Would you like to share more?";
  } catch {
    return "I'm having a connection issue right now, but your feelings matter. Take a slow breath 💙";
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function Auth({onAuth}){
  const[mode,setMode]=useState("login");
  const[f,setF]=useState({name:"",email:"",password:""});
  const[err,setErr]=useState("");
  const[busy,setBusy]=useState(false);
  const submit=async()=>{
    setErr(""); if(!f.email||!f.password){setErr("Please fill all fields");return;}
    if(mode==="register"&&!f.name){setErr("Name is required");return;}
    setBusy(true);
    try{
      const path=mode==="login"?"/auth/login":"/auth/register";
      const body=mode==="login"?{email:f.email,password:f.password}:{name:f.name,email:f.email,password:f.password};
      const data=await apiFetch(path,{method:"POST",body});
      localStorage.setItem("dx_token",data.access_token);
      onAuth(data.user);
    }catch(e){setErr(e.message||"Something went wrong");}
    setBusy(false);
  };
  const inp=(field,type="text")=>({type,value:f[field],onChange:e=>setF({...f,[field]:e.target.value}),onKeyDown:e=>e.key==="Enter"&&submit(),
    style:{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:"10px",color:"white",fontSize:"14px",outline:"none",boxSizing:"border-box",transition:"all 0.2s ease"}});
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 25% 15%, rgba(139, 92, 246, 0.12) 0%, #080811 50%, #0a1120 100%)",padding:"20px"}}>
      <div style={{background:"rgba(18, 14, 34, 0.8)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:"24px",padding:"44px 38px",width:"100%",maxWidth:"420px",boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 35px rgba(139,92,246,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:"26px"}}>
          <div style={{fontSize:"48px",marginBottom:"12px",display:"inline-block",animation:"floatSlow 3s ease-in-out infinite"}}>🧠</div>
          <h1 style={{fontSize:"28px",fontWeight:"800",letterSpacing:"-0.02em",background:"linear-gradient(135deg, #c084fc 0%, #60a5fa 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 4px 0"}}>Deprex</h1>
          <p style={{color:"rgba(255,255,255,0.48)",fontSize:"13px",margin:0}}>Mental Health Risk Monitoring & AI Companion</p>
        </div>
        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"4px",marginBottom:"24px",border:"1px solid rgba(255,255,255,0.06)"}}>
          {[["login","Sign In"],["register","Register"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"700",background:mode===m?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",color:mode===m?"white":"rgba(255,255,255,0.45)",transition:"all 0.2s ease"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"15px"}}>
          {mode==="register"&&<div><label style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",fontWeight:"600",display:"block",marginBottom:"6px"}}>Full Name</label><input {...inp("name")} placeholder="Your preferred name"/></div>}
          <div><label style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",fontWeight:"600",display:"block",marginBottom:"6px"}}>Email</label><input {...inp("email","email")} placeholder="you@example.com"/></div>
          <div><label style={{color:"rgba(255,255,255,0.6)",fontSize:"12px",fontWeight:"600",display:"block",marginBottom:"6px"}}>Password</label><input {...inp("password","password")} placeholder="••••••••"/></div>
        </div>
        {err&&<div style={{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:"10px",padding:"10px 14px",color:"#fca5a5",fontSize:"13px",marginTop:"16px",lineHeight:"1.4"}}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"700",cursor:"pointer",marginTop:"22px",opacity:busy?0.7:1,boxShadow:"0 8px 24px rgba(124, 58, 237, 0.4)",transition:"all 0.2s ease"}}>
          {busy?"Authenticating...":mode==="login"?"Sign In to Deprex":"Create Free Account"}
        </button>
        <p style={{textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:"11px",marginTop:"20px",lineHeight:"1.5"}}>⚕️ Deprex does not diagnose depression. Free 24/7 crisis support is always available at 988.</p>
      </div>
    </div>
  );
}

// Friendly placeholder hints for the free-text preference fields
// (getPlaceholderHint imported from catalog.js)


// ─── Standalone textarea — keeps local state so parent re-renders don't steal focus
function PreferenceInput({interest, data, savedValue, onSave}){
  const[text,setText]=useState(savedValue||"");
  useEffect(()=>{ setText(savedValue||""); },[savedValue]);
  return(
    <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${data.color}28`,borderRadius:"14px",padding:"18px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
        <div style={{width:"36px",height:"36px",background:`${data.color}20`,borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{data.icon}</div>
        <div>
          <div style={{color:"white",fontWeight:"700",fontSize:"13px"}}>{interest}</div>
          <div style={{color:"rgba(255,255,255,0.38)",fontSize:"11px"}}>What do you specifically enjoy about this?</div>
        </div>
        {text.trim()&&<span style={{marginLeft:"auto",background:"rgba(34,197,94,0.18)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:"20px",padding:"2px 9px",color:"#4ade80",fontSize:"10px",fontWeight:"600",flexShrink:0}}>✓ Filled in</span>}
      </div>
      <textarea
        value={text}
        onChange={e=>{ const v=e.target.value; setText(v); onSave(interest,v); }}
        placeholder={`e.g. "${getPlaceholderHint(interest)}"`}
        rows={2}
        style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:`1px solid ${text.trim()?data.color+"55":"rgba(255,255,255,0.1)"}`,borderRadius:"8px",color:"white",fontSize:"12px",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:"1.5",boxSizing:"border-box",transition:"border-color 0.2s"}}
      />
    </div>
  );
}

function InterestPicker({ user, initialInterests=[], initialSubInterests={}, isEdit=false, onComplete, onCancel }){
  const[step,setStep]=useState(1); // 1=pick interests, 2=refine preferences
  const[selected,setSelected]=useState(initialInterests);
  const[subInterests,setSubInterests]=useState(initialSubInterests); // {interest: [answer, ...]}
  const[search,setSearch]=useState("");
  const[saved,setSaved]=useState(false);
  const toggle=(item)=>setSelected(prev=>prev.includes(item)?prev.filter(i=>i!==item):[...prev,item]);

  // subInterests is now {interest: "free text string"}
  const updateSubText=(interest,text)=>setSubInterests(prev=>({...prev,[interest]:text}));

  // Filter categories/items by search
  const filtered = search.trim()
    ? INTEREST_CATEGORIES.map(cat=>({
        ...cat,
        items: cat.items.filter(i=>i.toLowerCase().includes(search.toLowerCase()))
      })).filter(cat=>cat.items.length>0)
    : INTEREST_CATEGORIES;

  // Interests that have resources (worth asking about)
  const refinable = selected.filter(i => INTEREST_RESOURCES[i]);

  const save=()=>{
    if(isEdit){ setSaved(true); setTimeout(()=>onComplete(selected,subInterests),800); }
    else onComplete(selected,subInterests);
  };

  const canSave = selected.length >= 3;

  if(saved) return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"14px"}}>
      <div style={{fontSize:"48px"}}>✅</div>
      <div style={{color:"white",fontWeight:"800",fontSize:"18px"}}>Interests updated!</div>
      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px"}}>Your resources are being personalised to your taste…</p>
    </div>
  );

  // ── Step 2: Free-text preferences per interest ────────────────────────────────
  if(step===2) return(
    <div style={{...(isEdit?{height:"100vh",overflowY:"auto",padding:"26px 30px"}:{minHeight:"100vh",background:"radial-gradient(ellipse at 20% 10%, #1a0a2e 0%, #0a0a14 45%, #091220 100%)",overflowY:"auto",padding:"36px 20px"})}}>
      <div style={{maxWidth:"820px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"32px",marginBottom:"8px"}}>🎯</div>
          <h1 style={{color:"white",fontSize:"21px",fontWeight:"900",marginBottom:"8px"}}>Tell us more about your taste</h1>
          <p style={{color:"rgba(255,255,255,0.42)",fontSize:"13px",lineHeight:"1.6",maxWidth:"520px",margin:"0 auto"}}>
            In your own words — describe what you specifically enjoy about each interest. We'll use this to put the most relevant resources first. This is optional, but the more you share the better it gets.
          </p>
        </div>

        {refinable.length===0?(
          <div style={{textAlign:"center",padding:"30px",color:"rgba(255,255,255,0.4)",fontSize:"14px"}}>You're all set — click below to get your resources!</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"90px"}}>
            {refinable.map(interest=>{
              const data=INTEREST_RESOURCES[interest];
              const saved=typeof subInterests[interest]==="string"?subInterests[interest]:"";
              return(
                <PreferenceInput
                  key={interest}
                  interest={interest}
                  data={data}
                  savedValue={saved}
                  onSave={updateSubText}
                />
              );
            })}
          </div>
        )}

        <div style={{position:"sticky",bottom:"0",background:isEdit?"rgba(10,10,20,0.95)":"rgba(10,10,20,0.92)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"14px 0 20px",marginTop:"10px",display:"flex",justifyContent:"center",gap:"12px",alignItems:"center"}}>
          <button onClick={()=>setStep(1)} style={{padding:"11px 22px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"rgba(255,255,255,0.5)",fontSize:"13px",cursor:"pointer"}}>← Back</button>
          <button onClick={save} style={{padding:"12px 32px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"10px",color:"white",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>
            {isEdit?"Save & personalise ✓":"Get my resources →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Pick interests ────────────────────────────────────────────────────
  return(
    <div style={{
      ...(isEdit ? {height:"100vh",overflowY:"auto",padding:"26px 30px"} : {minHeight:"100vh",background:"radial-gradient(ellipse at 20% 10%, #1a0a2e 0%, #0a0a14 45%, #091220 100%)",overflowY:"auto",padding:"36px 20px"})
    }}>
      <div style={{maxWidth:"820px",margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          {!isEdit && <div style={{fontSize:"38px",marginBottom:"10px"}}>✨</div>}
          <h1 style={{color:"white",fontSize:isEdit?"21px":"24px",fontWeight:"900",marginBottom:"8px"}}>
            {isEdit ? "✏️ Edit Your Interests" : `What do you love doing, ${user.name}?`}
          </h1>
          <p style={{color:"rgba(255,255,255,0.42)",fontSize:"13px",lineHeight:"1.6",maxWidth:"500px",margin:"0 auto 14px"}}>
            {isEdit
              ? "Add or remove interests — your stress relief resources update instantly to match."
              : "Pick what you enjoy. We'll give you real resources — chess puzzles, books, playlists, games — curated just for you."
            }
          </p>
          {/* Step indicator */}
          <div style={{display:"inline-flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
            <div style={{width:"24px",height:"24px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",color:"white"}}>1</div>
            <span style={{color:"rgba(255,255,255,0.5)",fontSize:"11px"}}>Pick interests</span>
            <div style={{width:"30px",height:"1px",background:"rgba(255,255,255,0.15)"}}/>
            <div style={{width:"24px",height:"24px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>2</div>
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:"11px"}}>Refine preferences</span>
          </div>
          {/* Live counter badge */}
          <div style={{display:"flex",justifyContent:"center"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(124,58,237,0.14)",border:"1px solid rgba(124,58,237,0.28)",borderRadius:"20px",padding:"5px 14px"}}>
              <span style={{color:"#c4b5fd",fontSize:"13px",fontWeight:"700"}}>{selected.length} selected</span>
              {selected.length>0 && (
                <button onClick={()=>setSelected([])} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"20px",color:"rgba(255,255,255,0.5)",fontSize:"11px",padding:"2px 8px",cursor:"pointer"}}>Clear all</button>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{position:"relative",marginBottom:"22px",maxWidth:"420px",margin:"0 auto 22px"}}>
          <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",fontSize:"14px",pointerEvents:"none"}}>🔍</span>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search interests (e.g. chess, jazz, yoga…)"
            style={{width:"100%",padding:"10px 14px 10px 36px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"white",fontSize:"13px",outline:"none",boxSizing:"border-box"}}
          />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:"14px"}}>✕</button>}
        </div>

        {/* Selected chips row (sticky preview) */}
        {selected.length>0&&(
          <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"12px",padding:"12px 16px",marginBottom:"22px",display:"flex",flexWrap:"wrap",gap:"6px",alignItems:"center"}}>
            <span style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",marginRight:"4px"}}>YOUR PICKS:</span>
            {selected.map(i=>{
              const data=INTEREST_RESOURCES[i];
              return(
                <button key={i} onClick={()=>toggle(i)} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 10px",background:data?`${data.color}22`:"rgba(255,255,255,0.1)",border:`1px solid ${data?data.color+"44":"rgba(255,255,255,0.18)"}`,borderRadius:"20px",color:data?data.color:"rgba(255,255,255,0.7)",fontSize:"11px",fontWeight:"600",cursor:"pointer"}}>
                  {data?.icon} {i} <span style={{opacity:0.5,marginLeft:"2px"}}>✕</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Category sections */}
        {filtered.length===0 && (
          <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.3)",fontSize:"14px"}}>No interests match "{search}"</div>
        )}
        {filtered.map(cat=>(
          <div key={cat.category} style={{marginBottom:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
              <span style={{fontSize:"17px"}}>{cat.icon}</span>
              <h3 style={{color:"rgba(255,255,255,0.65)",fontSize:"12px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"0.6px"}}>{cat.category}</h3>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
              {cat.items.map(item=>{
                const active=selected.includes(item);
                const data=INTEREST_RESOURCES[item];
                const hasSub=!!INTEREST_RESOURCES[item];
                return(
                  <button key={item} onClick={()=>toggle(item)} style={{
                    display:"flex",alignItems:"center",gap:"5px",
                    padding:"7px 13px",borderRadius:"20px",
                    border:`1px solid ${active?(data?data.color+"80":"rgba(124,58,237,0.75)"):"rgba(255,255,255,0.1)"}`,
                    background:active?(data?`${data.color}22`:"rgba(124,58,237,0.22)"):"rgba(255,255,255,0.03)",
                    color:active?(data?data.color:"#c4b5fd"):"rgba(255,255,255,0.48)",
                    fontSize:"12px",fontWeight:active?"700":"400",cursor:"pointer",transition:"all 0.13s"
                  }}>
                    {active && <span style={{fontSize:"11px"}}>✓</span>}
                    {data?.icon && <span style={{fontSize:"13px"}}>{data.icon}</span>}
                    {item}
                    {data && !active && <span style={{fontSize:"10px",opacity:0.55}}>📦</span>}
                    {hasSub && active && <span style={{fontSize:"10px",opacity:0.6}}>🎯</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer actions */}
        <div style={{position:"sticky",bottom:"0",background:isEdit?"rgba(10,10,20,0.95)":"rgba(10,10,20,0.92)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"14px 0 20px",marginTop:"10px",display:"flex",justifyContent:"center",gap:"12px",alignItems:"center"}}>
          {isEdit&&(
            <button onClick={onCancel} style={{padding:"11px 22px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"rgba(255,255,255,0.5)",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
          )}
          <button onClick={()=>canSave&&(refinable.length>0?setStep(2):save())} disabled={!canSave} style={{
            padding:"12px 32px",
            background:canSave?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.06)",
            border:"none",borderRadius:"10px",
            color:canSave?"white":"rgba(255,255,255,0.22)",
            fontSize:"14px",fontWeight:"700",
            cursor:canSave?"pointer":"not-allowed"
          }}>
            {!canSave ? `Select ${3-selected.length} more to continue` : refinable.length>0 ? `Next — personalise my resources →` : isEdit ? `Save ${selected.length} interests ✓` : `Start with ${selected.length} interests →`}
          </button>
        </div>
        {!isEdit&&<p style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:"11px",marginTop:"6px",paddingBottom:"20px"}}>📦 = real resources provided • 🎯 = extra personalisation available</p>}
      </div>
    </div>
  );
}

// ─── Activity completion → mood/risk impact ────────────────────────────────────
// Each completed activity logs a "relief event" that improves mood & lowers risk.
// moodBoost: 0–15 points added to mood score for that day's entry
// riskReduction: 0–0.08 subtracted from risk for each event (capped)
function computeActivityImpact(reliefEvents) {
  // reliefEvents: [{date, interestKey, resourceTitle, type}]
  // Returns per-day adjustments keyed by "MMM D" date string
  const byDay = {};
  reliefEvents.forEach(ev => {
    const key = new Date(ev.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});
    if (!byDay[key]) byDay[key] = { count: 0, moodBoost: 0, riskReduction: 0 };
    // Each activity adds mood and reduces risk, with diminishing returns
    const idx = byDay[key].count;
    byDay[key].moodBoost     += Math.max(2, 10 - idx * 2);   // 10, 8, 6, 4, 2…
    byDay[key].riskReduction += Math.max(0.01, 0.06 - idx * 0.01); // 0.06, 0.05…
    byDay[key].count++;
  });
  return byDay;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({tab,setTab,user,logout,risk}){
  const ri=riskInfo(risk);
  const navs=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"journal",icon:"📝",label:"Daily Journal"},
    {id:"assess",icon:"🌡️",label:"Mood Assessment"},
    {id:"relief",icon:"🌿",label:"Stress Relief"},
    {id:"chat",icon:"💬",label:"AI Support Chat"}
  ];
  return(
    <div style={{width:"256px",minHeight:"100vh",background:"rgba(12, 10, 24, 0.75)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRight:"1px solid rgba(139,92,246,0.15)",display:"flex",flexDirection:"column",padding:"22px 14px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:"11px",marginBottom:"26px",padding:"0 6px"}}>
        <div style={{width:"38px",height:"38px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"19px",flexShrink:0,boxShadow:"0 4px 14px rgba(124,58,237,0.35)"}}>🧠</div>
        <div>
          <div style={{color:"white",fontWeight:"800",fontSize:"17px",letterSpacing:"-0.01em"}}>Deprex</div>
          <div style={{color:"#4ade80",fontSize:"11px",display:"flex",alignItems:"center",gap:"4px",fontWeight:"600"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80"}}></span> Online
          </div>
        </div>
      </div>
      <div style={{background:ri.bg,border:`1px solid ${ri.border}`,borderRadius:"12px",padding:"12px",marginBottom:"18px",boxShadow:"0 4px 14px rgba(0,0,0,0.2)"}}>
        <div style={{color:"rgba(255,255,255,0.45)",fontSize:"10px",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:"700"}}>Risk Posture</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:ri.color,fontWeight:"700",fontSize:"13px"}}>{ri.label}</span>
          <span style={{color:ri.color,fontSize:"12px",fontWeight:"700"}}>{(risk*100).toFixed(0)}%</span>
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"4px",height:"4px",marginTop:"6px",overflow:"hidden"}}>
          <div style={{width:`${risk*100}%`,height:"100%",borderRadius:"4px",background:ri.color,transition:"width 0.6s ease"}}/>
        </div>
      </div>
      {user.interests?.length>0&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(139,92,246,0.12)",borderRadius:"10px",padding:"10px 11px",marginBottom:"6px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:"700"}}>My Interests</div>
            <button onClick={()=>setTab("editInterests")} style={{background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.35)",borderRadius:"6px",padding:"2px 8px",color:"#c4b5fd",fontSize:"10px",cursor:"pointer",fontWeight:"600"}}>✏️ Edit</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
            {user.interests.slice(0,6).map(i=>{
              const d=INTEREST_RESOURCES[i];
              return <span key={i} style={{background:d?`${d.color}18`:"rgba(124,58,237,0.16)",border:`1px solid ${d?d.color+"30":"rgba(124,58,237,0.3)"}`,borderRadius:"20px",padding:"2px 8px",color:d?d.color:"#c4b5fd",fontSize:"10px",display:"flex",alignItems:"center",gap:"3px",fontWeight:"600"}}>{d?.icon} {i}</span>;
            })}
            {user.interests.length>6&&<button onClick={()=>setTab("editInterests")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:"10px",cursor:"pointer",padding:"2px 5px"}}>+{user.interests.length-6} more…</button>}
          </div>
        </div>
      )}
      {(!user.interests||user.interests.length===0)&&(
        <button onClick={()=>setTab("editInterests")} style={{display:"flex",alignItems:"center",gap:"7px",width:"100%",padding:"10px 12px",background:"rgba(124,58,237,0.1)",border:"1px dashed rgba(124,58,237,0.4)",borderRadius:"10px",color:"#c4b5fd",fontSize:"12px",cursor:"pointer",marginBottom:"6px",fontWeight:"600"}}>
          ✨ Set your interests
        </button>
      )}
      <nav style={{flex:1,marginTop:"12px"}}>
        {navs.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"11px 13px",borderRadius:"10px",
            border:tab===n.id?"1px solid rgba(124,58,237,0.45)":"1px solid transparent",
            cursor:"pointer",marginBottom:"4px",
            background:tab===n.id?"linear-gradient(90deg, rgba(124,58,237,0.24) 0%, rgba(37,99,235,0.12) 100%)":"transparent",
            color:tab===n.id?"white":"rgba(255,255,255,0.45)",
            fontWeight:tab===n.id?"700":"400",
            fontSize:"13px",textAlign:"left",transition:"all 0.15s ease",
            boxShadow:tab===n.id?"0 4px 14px rgba(124,58,237,0.2)":"none"
          }}>
            <span style={{fontSize:"16px"}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"9px",padding:"6px 10px",marginBottom:"8px"}}>
          <div style={{width:"30px",height:"30px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"700",fontSize:"12px",flexShrink:0}}>{user.name[0].toUpperCase()}</div>
          <div style={{overflow:"hidden"}}><div style={{color:"white",fontSize:"12px",fontWeight:"700",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div><div style={{color:"rgba(255,255,255,0.35)",fontSize:"10px"}}>{user.email}</div></div>
        </div>
        <button onClick={logout} style={{width:"100%",padding:"9px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:"8px",color:"#fca5a5",fontSize:"12px",fontWeight:"600",cursor:"pointer",transition:"all 0.2s"}}>Sign Out</button>
      </div>
    </div>
  );
}

// ─── Dashboard (Reflective Journey) ──────────────────────────────────────────
function Dashboard({user,risk,journals,assessHistory,reliefEvents,chatEvents,setTab}){
  const [selectedMood, setSelectedMood] = useState(null);
  const latestAssess = assessHistory[assessHistory.length - 1];
  const sev = latestAssess ? severityLabel(latestAssess.score) : null;
  const recentJournal = journals[0];

  const MOOD_OPTIONS = [
    { emoji: "✨", label: "Radiant", color: "#fbbf24", note: "Celebrate this warmth and carry it gently through your day." },
    { emoji: "🌿", label: "Peaceful", color: "#4ade80", note: "A calm harbor is precious. Savor this centered stillness." },
    { emoji: "☁️", label: "Foggy", color: "#94a3b8", note: "It's okay to feel unclear. Rest without pressure to solve anything." },
    { emoji: "🌧️", label: "Heavy", color: "#60a5fa", note: "Your fatigue or sorrow is heard. Be extraordinarily gentle with yourself." },
    { emoji: "🌪️", label: "Overwhelmed", color: "#f87171", note: "You are not alone in this storm. Try 60 seconds of box breathing below." },
  ];

  const activeMoodObj = MOOD_OPTIONS.find(m => m.label === selectedMood);

  return (
    <div style={{ padding: "34px 20px", overflowY: "auto", height: "100vh", paddingBottom: "70px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Warm Narrative Greeting */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ fontSize: "38px" }}>🌱</span>
          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "800", marginTop: "8px", letterSpacing: "-0.01em" }}>
            How is your heart feeling today, {user.name}?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: "5px" }}>
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
                  transition: "all 0.2s ease",
                  boxShadow: selectedMood === m.label ? `0 0 15px ${m.color}40` : "none"
                }}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
          {activeMoodObj && (
            <div style={{
              marginTop: "14px",
              padding: "10px 18px",
              background: `${activeMoodObj.color}15`,
              border: `1px solid ${activeMoodObj.color}35`,
              borderRadius: "12px",
              display: "inline-block",
              color: "#f1f5f9",
              fontSize: "12px"
            }}>
              Acknowledged: You are feeling <strong style={{ color: activeMoodObj.color }}>{activeMoodObj.label}</strong>. {activeMoodObj.note}
            </div>
          )}
        </div>

        {/* Narrative Milestone Stream */}
        <div style={{ position: "relative", paddingLeft: "30px", borderLeft: "2px dashed rgba(139, 92, 246, 0.25)", marginLeft: "14px" }}>
          
          {/* Milestone 1: Daily Somatic Anchor */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 10px #8b5cf6" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.22)", borderRadius: "14px", padding: "18px", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#c4b5fd", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Somatic Anchor</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Daily practice</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>4-4-4-4 Box Breathing Reset</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                Soothe your autonomic nervous system and release muscle tightness with our guided 4-phase breathing sanctuary.
              </p>
              <button
                onClick={() => setTab("relief")}
                style={{ marginTop: "10px", padding: "8px 16px", background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))", border: "1px solid rgba(139,92,246,0.45)", borderRadius: "9px", color: "#c4b5fd", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                🌿 Launch Breathing Sanctuary ↗
              </button>
            </div>
          </div>

          {/* Milestone 2: Journal Chronicle */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 10px #3b82f6" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: "14px", padding: "18px", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#93c5fd", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Reflective Space</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>Writing</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Your Daily Journal</h3>
              {recentJournal ? (
                <div style={{ marginTop: "8px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", borderLeft: "3px solid #3b82f6" }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", marginBottom: "3px" }}>Latest Entry:</div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontStyle: "italic", lineHeight: "1.4" }}>
                    "{(recentJournal.text || recentJournal.content || "").slice(0, 120)}…"
                  </div>
                </div>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                  Writing untangles difficult knots in the mind. Record a short moment from your day.
                </p>
              )}
              <button
                onClick={() => setTab("journal")}
                style={{ marginTop: "10px", padding: "8px 16px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "9px", color: "#93c5fd", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                📝 {recentJournal ? "Continue Journaling ↗" : "Write First Reflection ↗"}
              </button>
            </div>
          </div>

          {/* Milestone 3: Clinical Baseline */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: "14px", padding: "18px", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#6ee7b7", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Clinical Baseline</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>PHQ-9 psychometric</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Mood & Risk Posture</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                {latestAssess ? `Last screening score: ${latestAssess.score}/27 • ${sev?.label || "Monitored"}` : "Track clinical trends over time to guide conversations with your care circle."}
              </p>
              <button
                onClick={() => setTab("assess")}
                style={{ marginTop: "10px", padding: "8px 16px", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "9px", color: "#6ee7b7", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                🌡️ {latestAssess ? "Retake PHQ-9 Assessment ↗" : "Start PHQ-9 Screening ↗"}
              </button>
            </div>
          </div>

          {/* Milestone 4: AI Support Companion */}
          <div style={{ position: "relative", marginBottom: "26px" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: "14px", padding: "18px", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#d8b4fe", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Support Companion</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>24/7 AI conversation</span>
              </div>
              <h3 style={{ color: "white", fontSize: "15px", fontWeight: "700", margin: 0 }}>Conversational Sanctuary</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
                Vent freely, unpack heavy emotions, or practice cognitive reframing anytime.
              </p>
              <button
                onClick={() => setTab("chat")}
                style={{ marginTop: "10px", padding: "8px 16px", background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "9px", color: "#d8b4fe", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
              >
                💬 Chat with Companion ↗
              </button>
            </div>
          </div>

          {/* Milestone 5: 24/7 Crisis Guardrail */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "-39px", top: "0", width: "16px", height: "16px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />
            <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(139,92,246,0.04) 100%)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", padding: "18px", backdropFilter: "blur(12px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ color: "#f87171", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>Immediate Lifeline</div>
                <h4 style={{ color: "white", fontSize: "14px", fontWeight: "700", margin: "2px 0" }}>988 Suicide & Crisis Lifeline</h4>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", margin: 0 }}>Free, confidential, available 24/7 by call or text.</p>
              </div>
              <a
                href="tel:988"
                style={{
                  padding: "9px 18px",
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
                📞 Call 988
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Journal ──────────────────────────────────────────────────────────────────
function Journal({user,journals,onSave}){
  const[text,setText]=useState(""); const[analysis,setAnalysis]=useState(null); const[saved,setSaved]=useState(false);
  const analyze=()=>{if(text.trim().length<15)return;setAnalysis({sentiment:analyzeSentiment(text),emotions:detectEmotions(text)});};
  const save=()=>{if(!analysis)return;onSave({id:Date.now(),date:new Date().toISOString(),text,sentiment:analysis.sentiment,emotions:analysis.emotions});setSaved(true);setTimeout(()=>{setText("");setAnalysis(null);setSaved(false);},2000);};
  return(
    <div style={{padding:"26px 30px",overflowY:"auto",height:"100vh"}}>
      <h1 style={{color:"white",fontSize:"21px",fontWeight:"800",marginBottom:"4px"}}>📝 Daily Mood Journal</h1>
      <p style={{color:"rgba(255,255,255,0.32)",marginBottom:"20px",fontSize:"13px"}}>Write freely — this is your safe space. We'll gently reflect how your entry feels.</p>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"20px",marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><label style={{color:"rgba(255,255,255,0.55)",fontSize:"13px",fontWeight:"600"}}>Today's Entry</label><span style={{color:"rgba(255,255,255,0.22)",fontSize:"11px"}}>{new Date().toLocaleDateString()}</span></div>
        <textarea value={text} onChange={e=>{setText(e.target.value);setAnalysis(null);}} placeholder="How are you feeling today? This is your safe space..." style={{width:"100%",minHeight:"140px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"13px",color:"white",fontSize:"13px",lineHeight:"1.6",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:"9px",marginTop:"11px"}}>
          <button onClick={analyze} disabled={text.trim().length<15} style={{padding:"8px 16px",background:text.trim().length>=15?"rgba(124,58,237,0.22)":"rgba(255,255,255,0.04)",border:`1px solid ${text.trim().length>=15?"rgba(124,58,237,0.45)":"rgba(255,255,255,0.07)"}`,borderRadius:"8px",color:text.trim().length>=15?"#c4b5fd":"rgba(255,255,255,0.22)",cursor:text.trim().length>=15?"pointer":"not-allowed",fontSize:"13px",fontWeight:"600"}}>🔍 Analyze</button>
          {analysis&&!saved&&<button onClick={save} style={{padding:"8px 16px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"8px",color:"white",cursor:"pointer",fontSize:"13px",fontWeight:"600"}}>💾 Save</button>}
          {saved&&<button disabled style={{padding:"8px 16px",background:"rgba(34,197,94,0.18)",border:"1px solid rgba(34,197,94,0.35)",borderRadius:"8px",color:"#4ade80",fontSize:"13px"}}>✓ Saved!</button>}
        </div>
      </div>
      {analysis&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"18px",marginBottom:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"13px"}}><span>✨</span><h3 style={{color:"white",fontWeight:"700",fontSize:"13px"}}>How your entry feels</h3></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div style={{background:`${analysis.sentiment.color}10`,border:`1px solid ${analysis.sentiment.color}28`,borderRadius:"9px",padding:"12px"}}>
              <div style={{color:"rgba(255,255,255,0.36)",fontSize:"10px",marginBottom:"4px"}}>SENTIMENT</div>
              <div style={{color:analysis.sentiment.color,fontSize:"17px",fontWeight:"800"}}>{analysis.sentiment.label}</div>
              <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"3px",height:"4px",marginTop:"7px"}}><div style={{width:`${analysis.sentiment.score*100}%`,height:"100%",borderRadius:"3px",background:analysis.sentiment.color}}/></div>
            </div>
            <div style={{background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"9px",padding:"12px"}}>
              <div style={{color:"rgba(255,255,255,0.36)",fontSize:"10px",marginBottom:"7px"}}>EMOTIONS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>{analysis.emotions.map(e=><span key={e} style={{background:"rgba(124,58,237,0.24)",borderRadius:"20px",padding:"3px 8px",color:"#c4b5fd",fontSize:"11px",fontWeight:"600"}}>{e}</span>)}</div>
            </div>
          </div>
        </div>
      )}
      {journals?.length>0&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"18px"}}>
          <h3 style={{color:"white",fontWeight:"700",marginBottom:"12px",fontSize:"13px"}}>Previous Entries ({journals.length})</h3>
          <div style={{maxHeight:"240px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"8px"}}>
            {[...journals].reverse().map(e=>(
              <div key={e.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",padding:"10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:"11px"}}>{new Date(e.date).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                  <div style={{display:"flex",gap:"4px"}}><span style={{background:`${e.sentiment.color}16`,border:`1px solid ${e.sentiment.color}30`,borderRadius:"20px",padding:"1px 7px",color:e.sentiment.color,fontSize:"10px",fontWeight:"600"}}>{e.sentiment.label}</span>{e.emotions.slice(0,2).map(em=><span key={em} style={{background:"rgba(124,58,237,0.15)",borderRadius:"20px",padding:"1px 7px",color:"#c4b5fd",fontSize:"10px"}}>{em}</span>)}</div>
                </div>
                <p style={{color:"rgba(255,255,255,0.48)",fontSize:"12px",lineHeight:"1.4",margin:0}}>{e.text.slice(0,120)}{e.text.length>120?"...":""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assessment ───────────────────────────────────────────────────────────────
function Assessment({onSave,history}){
  const[answers,setAnswers]=useState(Array(ASSESSMENT_QUESTIONS.length).fill(null));
  const[result,setResult]=useState(null);
  const score=answers.reduce((s,a)=>s+(a!==null?(3-a):0),0);
  const allDone=answers.every(a=>a!==null);
  const submit=()=>{const sev=severityLabel(score);const r={score,severity:sev.label,date:new Date().toISOString()};setResult({...r,sev});onSave(r);};
  if(result) return(
    <div style={{padding:"26px 30px",overflowY:"auto",height:"100vh"}}>
      <div style={{maxWidth:"520px"}}>
        <h1 style={{color:"white",fontSize:"21px",fontWeight:"800",marginBottom:"18px"}}>🌡️ Assessment Results</h1>
        <div style={{background:`${result.sev.color}10`,border:`1px solid ${result.sev.color}28`,borderRadius:"16px",padding:"24px",textAlign:"center",marginBottom:"16px"}}>
          <div style={{fontSize:"52px",fontWeight:"900",color:result.sev.color}}>{result.score}</div>
          <div style={{color:"white",fontSize:"18px",fontWeight:"700",margin:"5px 0"}}>{result.sev.label}</div>
          <div style={{color:"rgba(255,255,255,0.35)",fontSize:"12px",marginBottom:"12px"}}>Score: {result.score} / {ASSESSMENT_QUESTIONS.length*3}</div>
          <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"6px",height:"6px",marginBottom:"7px"}}><div style={{width:`${(result.score/(ASSESSMENT_QUESTIONS.length*3))*100}%`,height:"100%",borderRadius:"6px",background:result.sev.color,transition:"width 1s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",color:"rgba(255,255,255,0.22)",fontSize:"10px"}}><span>Doing Well</span><span>Mild</span><span>Moderate</span><span>High Concern</span></div>
        </div>
        <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:"9px",padding:"12px",marginBottom:"14px",fontSize:"12px",color:"rgba(255,255,255,0.48)",lineHeight:"1.5"}}>
          ⚕️ <strong style={{color:"rgba(255,255,255,0.7)"}}>Not a diagnosis.</strong> This screens how you've been feeling. For evaluation and care, consult a qualified mental health professional.
        </div>
        {result.score>=ASSESSMENT_QUESTIONS.length*1.5&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:"9px",padding:"12px",marginBottom:"14px"}}><p style={{color:"#f87171",fontWeight:"700",fontSize:"12px",marginBottom:"4px"}}>Professional Support Recommended</p><p style={{color:"rgba(255,255,255,0.45)",fontSize:"12px"}}>Your responses suggest speaking with a mental health professional would be beneficial.</p></div>}
        <button onClick={()=>{setAnswers(Array(ASSESSMENT_QUESTIONS.length).fill(null));setResult(null);}} style={{padding:"10px 22px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"9px",color:"white",fontWeight:"700",cursor:"pointer",fontSize:"13px"}}>Retake Assessment</button>
      </div>
    </div>
  );
  return(
    <div style={{padding:"26px 30px",overflowY:"auto",height:"100vh"}}>
      <h1 style={{color:"white",fontSize:"21px",fontWeight:"800",marginBottom:"4px"}}>🌡️ Mood Assessment</h1>
      <p style={{color:"rgba(255,255,255,0.32)",marginBottom:"8px",fontSize:"13px"}}>Reflect on how you've been feeling over the <strong style={{color:"rgba(255,255,255,0.55)"}}>past week</strong>.</p>
      <div style={{background:"rgba(255,165,0,0.07)",border:"1px solid rgba(255,165,0,0.18)",borderRadius:"8px",padding:"7px 12px",marginBottom:"18px",fontSize:"11px",color:"rgba(255,255,255,0.36)"}}>⚕️ Screening tool only — not a diagnostic instrument or medical advice.</div>
      <div style={{display:"flex",flexDirection:"column",gap:"11px",marginBottom:"75px"}}>
        {ASSESSMENT_QUESTIONS.map((item,qi)=>(
          <div key={qi} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${answers[qi]!==null?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:"12px",padding:"15px",transition:"border-color 0.2s"}}>
            <div style={{display:"flex",gap:"9px",marginBottom:"10px"}}>
              <span style={{background:"rgba(124,58,237,0.2)",color:"#a78bfa",borderRadius:"50%",width:"21px",height:"21px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",flexShrink:0}}>{qi+1}</span>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",lineHeight:"1.4",margin:0}}>{item.q}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px"}}>
              {item.opts.map((opt,oi)=>(
                <button key={oi} onClick={()=>{const n=[...answers];n[qi]=oi;setAnswers(n);}} style={{padding:"7px 5px",borderRadius:"7px",border:`1px solid ${answers[qi]===oi?"rgba(124,58,237,0.65)":"rgba(255,255,255,0.08)"}`,background:answers[qi]===oi?"rgba(124,58,237,0.25)":"rgba(255,255,255,0.02)",color:answers[qi]===oi?"#c4b5fd":"rgba(255,255,255,0.36)",cursor:"pointer",fontSize:"11px",fontWeight:answers[qi]===oi?"700":"400",transition:"all 0.13s",lineHeight:"1.3",textAlign:"center"}}>{opt}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {history.length>0&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"11px",padding:"14px",marginBottom:"14px"}}><h4 style={{color:"white",fontWeight:"700",marginBottom:"8px",fontSize:"12px"}}>Assessment History</h4>{[...history].reverse().slice(0,4).map((h,i)=>{const s=severityLabel(h.score);return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.05)":"none"}}><span style={{color:"rgba(255,255,255,0.35)",fontSize:"11px"}}>{new Date(h.date).toLocaleDateString()}</span><span style={{color:"white",fontWeight:"600",fontSize:"11px"}}>Score: {h.score}</span><span style={{color:s.color,fontSize:"11px",fontWeight:"600"}}>{s.label}</span></div>);})}</div>}
      <div style={{position:"sticky",bottom:"20px",display:"flex",alignItems:"center",gap:"12px",background:"rgba(10,10,20,0.92)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"11px",padding:"12px 18px"}}>
        <div style={{flex:1}}><div style={{color:"rgba(255,255,255,0.36)",fontSize:"11px"}}>{answers.filter(a=>a!==null).length}/{ASSESSMENT_QUESTIONS.length} answered</div><div style={{background:"rgba(255,255,255,0.07)",borderRadius:"3px",height:"3px",marginTop:"4px"}}><div style={{width:`${(answers.filter(a=>a!==null).length/ASSESSMENT_QUESTIONS.length)*100}%`,height:"100%",borderRadius:"3px",background:"linear-gradient(90deg,#7c3aed,#2563eb)",transition:"width 0.3s"}}/></div></div>
        <button onClick={submit} disabled={!allDone} style={{padding:"9px 20px",background:allDone?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.05)",border:"none",borderRadius:"8px",color:allDone?"white":"rgba(255,255,255,0.22)",cursor:allDone?"pointer":"not-allowed",fontWeight:"700",fontSize:"13px"}}>Submit</button>
      </div>
    </div>
  );
}

// ─── Stress Relief ────────────────────────────────────────────────────────────
// Groups related user interests into combined sections, putting the user's
// specific picks first. E.g. Chess + Sudoku → "Your Puzzle Games" with Chess
// resources leading, then Sudoku resources, unique cards only.

// (getCategoryFor imported from catalog.js)

// ─── SubEditor — top-level so useState is stable across StressRelief re-renders ─
function SubEditor({interest, savedValue, onSave, onCancel, isLoading}){
  const data=INTEREST_RESOURCES[interest];
  const[text,setText]=useState(typeof savedValue==="string"?savedValue:"");
  useEffect(()=>{ setText(typeof savedValue==="string"?savedValue:""); },[savedValue]);
  const hasExisting=!!(savedValue&&savedValue.trim());
  return(
    <div style={{background:`${data.color}0c`,border:`1px solid ${data.color}35`,borderRadius:"11px",padding:"14px",marginBottom:"12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"6px"}}>
        <span style={{fontSize:"15px"}}>🎯</span>
        <div style={{color:"white",fontSize:"12px",fontWeight:"700"}}>Tell us what you like about {interest}</div>
      </div>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",lineHeight:"1.5",marginBottom:"10px"}}>
        Describe your specific taste — the more detail, the better we can sort resources for you.<br/>
        <span style={{color:"rgba(255,255,255,0.25)"}}>e.g. "I love tactical chess puzzles and endgame studies" or "I prefer slow calming music, no lyrics"</span>
      </p>
      <textarea
        value={text}
        onChange={e=>setText(e.target.value)}
        placeholder={`What specifically do you enjoy about ${interest}? (your own words)`}
        rows={3}
        style={{width:"100%",padding:"10px 12px",background:"rgba(255,255,255,0.06)",border:`1px solid ${data.color}40`,borderRadius:"8px",color:"white",fontSize:"12px",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:"1.5",boxSizing:"border-box"}}
      />
      <div style={{display:"flex",gap:"7px",alignItems:"center",marginTop:"9px"}}>
        <button
          onClick={()=>onSave(interest,text.trim())}
          disabled={!text.trim()||isLoading}
          style={{padding:"7px 16px",background:text.trim()&&!isLoading?`${data.color}35`:"rgba(255,255,255,0.06)",border:`1px solid ${text.trim()&&!isLoading?data.color+"60":"rgba(255,255,255,0.1)"}`,borderRadius:"7px",color:text.trim()&&!isLoading?data.color:"rgba(255,255,255,0.28)",cursor:text.trim()&&!isLoading?"pointer":"not-allowed",fontSize:"12px",fontWeight:"700",transition:"all 0.15s"}}
        >
          {isLoading?"Sorting resources…":"✓ Save & personalise"}
        </button>
        {hasExisting&&<button onClick={()=>{onSave(interest,"");setText("");}} style={{padding:"7px 11px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"7px",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:"11px"}}>Clear</button>}
        <button onClick={onCancel} style={{padding:"7px 10px",background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:"11px"}}>Cancel</button>
        {hasExisting&&!isLoading&&<span style={{color:data.color,fontSize:"10px",marginLeft:"auto",fontWeight:"600",opacity:0.8}}>✓ Personalised</span>}
      </div>
    </div>
  );
}

function StressRelief({user,onActivityComplete,onEditInterests}){
  const[openResource,setOpenResource]=useState(null);
  const[sectionKeys,setSectionKeys]=useState({});
  const[completed,setCompleted]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem(`dx_completed_${user.email}`)||"{}"); }catch{ return {}; }
  });
  const[quickDone,setQuickDone]=useState({});
  const[editingSub,setEditingSub]=useState(null);
  const[subInterests,setSubInterests]=useState(()=>user.subInterests||{});

  // ── 4-4-4-4 Box Breathing State ─────────────────────────────────────────
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0); // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const BREATH_PHASES = [
    { label: "Inhale Slowly", hint: "Breathe in deeply through your nose", color: "#8b5cf6", scale: 1.45 },
    { label: "Hold Breath", hint: "Retain gently with calm awareness", color: "#38bdf8", scale: 1.45 },
    { label: "Exhale Gently", hint: "Release all tension smoothly through your mouth", color: "#4ade80", scale: 1.0 },
    { label: "Rest & Pause", hint: "Stay relaxed and still before the next breath", color: "#a855f7", scale: 1.0 },
  ];

  useEffect(() => {
    if (!breathingActive) return;
    const interval = setInterval(() => {
      setBreathSeconds(s => {
        if (s <= 1) {
          setBreathPhaseIndex(p => {
            const next = (p + 1) % 4;
            if (next === 0) {
              setCyclesCompleted(c => {
                const newC = c + 1;
                onActivityComplete({ date: new Date().toISOString(), interestKey: "mindfulness", resourceTitle: `Box Breathing (Cycle #${newC})` });
                return newC;
              });
            }
            return next;
          });
          return 4;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breathingActive, onActivityComplete]);

  const interests=user.interests||[];
  const matched=interests.filter(i=>INTEREST_RESOURCES[i]);

  const markComplete=(sectionId,resourceTitle)=>{
    const key=`${sectionId}::${resourceTitle}`;
    const today=new Date().toISOString();
    const existing=completed[key]||{count:0};
    const updated={...completed,[key]:{date:today,count:existing.count+1,sectionId,resourceTitle}};
    setCompleted(updated);
    localStorage.setItem(`dx_completed_${user.email}`,JSON.stringify(updated));
    onActivityComplete({date:today,interestKey:sectionId,resourceTitle});
  };

  const saveSubInterest=async(interest, text)=>{
    const updated={...subInterests,[interest]:text};
    setSubInterests(updated);
    setEditingSub(null);
    setSectionKeys(prev=>({...prev,[interest]:(prev[interest]||0)+1}));
    try{ await apiFetch("/user/sub-interest",{method:"PATCH",body:{interest,description:text}}); }catch{}
  };

  // Build grouped sections by category, using AI-personalised ordering when desc is saved
  const[personalisedResources,setPersonalisedResources]=useState({}); // {sectionId: [resources]}
  const[loadingPersonalise,setLoadingPersonalise]=useState({});

  // When subInterests or sectionKeys change, re-personalise affected sections
  useEffect(()=>{
    matched.forEach(interest=>{
      const desc=subInterests[interest];
      if(!desc||!desc.trim()) return;
      const data=INTEREST_RESOURCES[interest];
      if(!data) return;
      const cacheKey=`${interest}::${desc}`;
      if(personalisedResources[cacheKey]) return; // already fetched
      setLoadingPersonalise(p=>({...p,[interest]:true}));
      getPersonalisedResources(interest, desc, data.resources).then(ordered=>{
        setPersonalisedResources(p=>({...p,[cacheKey]:ordered}));
        setLoadingPersonalise(p=>({...p,[interest]:false}));
      });
    });
  },[subInterests, matched.join(",")]);

  const getResourcesForInterest=(interest)=>{
    const desc=subInterests[interest];
    const data=INTEREST_RESOURCES[interest];
    if(!data) return [];
    if(desc&&desc.trim()){
      const cacheKey=`${interest}::${desc}`;
      if(personalisedResources[cacheKey]) return personalisedResources[cacheKey];
    }
    return data.resources;
  };

  const sections=(()=>{
    const catMap={};
    matched.forEach(i=>{const cat=getCategoryFor(i);if(!catMap[cat])catMap[cat]=[];catMap[cat].push(i);});
    return Object.entries(catMap).map(([cat,catInterests])=>{
      const leadData=INTEREST_RESOURCES[catInterests[0]];
      const seen=new Set();const allResources=[];
      catInterests.forEach(interest=>{
        const resources=getResourcesForInterest(interest);
        resources.forEach(r=>{
          if(!seen.has(r.title)){seen.add(r.title);allResources.push({...r,_fromInterest:interest,_fromColor:INTEREST_RESOURCES[interest]?.color,_fromIcon:INTEREST_RESOURCES[interest]?.icon});}
        });
      });
      const sectionId=catInterests.join("+");
      return{sectionId,cat,catInterests,leadData,allResources};
    });
  })();

  const getRotatedResources=(sectionId,allResources)=>{
    const key=sectionKeys[sectionId]||0;
    if(key===0) return allResources;
    // Seeded shuffle: each refresh click gives a genuinely different order
    const arr=[...allResources];
    let seed=(key*2654435761)>>>0;
    for(let i=arr.length-1;i>0;i--){
      seed=((seed^(seed>>>13))*1664525+1013904223)>>>0;
      const j=seed%(i+1);
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  };

  const totalCompleted=Object.keys(completed).length;
  const todayStr=new Date().toDateString();
  const todayCompleted=Object.values(completed).filter(v=>new Date(v.date).toDateString()===todayStr).length;

  const ResourceCard=({res,sectionId,color})=>{
    const compKey=`${sectionId}::${res.title}`;
    const isDone=!!completed[compKey];
    const doneCount=completed[compKey]?.count||0;
    const cardColor=res._fromColor||color;
    return(
      <div style={{background:isDone?"rgba(34,197,94,0.07)":"rgba(255,255,255,0.04)",border:`1px solid ${isDone?"rgba(34,197,94,0.3)":cardColor+"28"}`,borderRadius:"12px",padding:"13px",display:"flex",flexDirection:"column",gap:"8px",transition:"all 0.2s",position:"relative"}}>
        {isDone&&<div style={{position:"absolute",top:"9px",right:"9px",background:"rgba(34,197,94,0.25)",borderRadius:"50%",width:"20px",height:"20px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>✓</div>}
        <div style={{display:"flex",gap:"9px",alignItems:"flex-start"}}>
          <div style={{width:"36px",height:"36px",background:isDone?"rgba(34,197,94,0.18)":`${cardColor}20`,borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>{res.thumb}</div>
          <div style={{flex:1,minWidth:0,paddingRight:"22px"}}>
            <div style={{color:isDone?"rgba(255,255,255,0.45)":"white",fontWeight:"700",fontSize:"12px",textDecoration:isDone?"line-through":"none",marginBottom:"2px"}}>{res.title}</div>
            <div style={{color:"rgba(255,255,255,0.42)",fontSize:"11px",lineHeight:"1.35"}}>{res.note}</div>
            {doneCount>0&&<div style={{color:"#4ade80",fontSize:"10px",marginTop:"3px",fontWeight:"600"}}>✓ Completed {doneCount}×</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          {res.type==="embed"&&(
            <button onClick={()=>setOpenResource({url:res.url,title:res.title})} style={{flex:1,padding:"6px 9px",background:`${cardColor}28`,border:`1px solid ${cardColor}50`,borderRadius:"7px",color:cardColor,cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>▶ {res.cta}</button>
          )}
          <a href={res.url} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"6px 9px",background:res.type==="embed"?"rgba(255,255,255,0.05)":`${cardColor}28`,border:`1px solid ${res.type==="embed"?"rgba(255,255,255,0.09)":cardColor+"50"}`,borderRadius:"7px",color:res.type==="embed"?"rgba(255,255,255,0.4)":cardColor,textDecoration:"none",fontSize:"11px",fontWeight:"700",textAlign:"center",display:"block"}}>
            {res.type==="embed"?"↗ Open Tab":`↗ ${res.cta}`}
          </a>
          <button onClick={()=>markComplete(sectionId,res.title)} title={isDone?"Mark again":"Mark as done"} style={{padding:"6px 10px",background:isDone?"rgba(34,197,94,0.22)":"rgba(34,197,94,0.1)",border:`1px solid ${isDone?"rgba(34,197,94,0.5)":"rgba(34,197,94,0.28)"}`,borderRadius:"7px",color:isDone?"#4ade80":"rgba(34,197,94,0.75)",cursor:"pointer",fontSize:"13px",fontWeight:"700",flexShrink:0,transition:"all 0.15s"}}>✓</button>
        </div>
      </div>
    );
  };

  // SubEditor is defined outside as a top-level component (see SubEditor function above StressRelief)

  return(
    <div style={{height:"100vh",overflowY:"auto",padding:"26px 30px"}}>

      {openResource&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",background:"rgba(12,8,26,0.98)",borderBottom:"1px solid rgba(255,255,255,0.09)"}}>
            <div style={{color:"white",fontWeight:"700",fontSize:"14px"}}>🌿 {openResource.title}</div>
            <div style={{display:"flex",gap:"9px"}}>
              <a href={openResource.url} target="_blank" rel="noopener noreferrer" style={{padding:"6px 13px",background:"rgba(124,58,237,0.28)",border:"1px solid rgba(124,58,237,0.48)",borderRadius:"8px",color:"#c4b5fd",textDecoration:"none",fontSize:"12px"}}>Open in New Tab ↗</a>
              <button onClick={()=>setOpenResource(null)} style={{padding:"6px 13px",background:"rgba(239,68,68,0.18)",border:"1px solid rgba(239,68,68,0.38)",borderRadius:"8px",color:"#f87171",cursor:"pointer",fontSize:"12px"}}>✕ Close</button>
            </div>
          </div>
          <iframe src={openResource.url} style={{flex:1,border:"none",width:"100%"}} title={openResource.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"/>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
        <div>
          <h1 style={{color:"white",fontSize:"21px",fontWeight:"800"}}>🌿 Your Stress Relief</h1>
          <p style={{color:"rgba(255,255,255,0.32)",marginTop:"3px",fontSize:"13px"}}>Personalised to what you love — mark activities done to update your progress.</p>
        </div>
        <button onClick={onEditInterests} style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 13px",background:"rgba(124,58,237,0.14)",border:"1px solid rgba(124,58,237,0.32)",borderRadius:"9px",color:"#c4b5fd",cursor:"pointer",fontSize:"12px",fontWeight:"600",flexShrink:0}}>
          ✏️ Edit Interests
        </button>
      </div>

      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"11px",padding:"12px 16px",marginBottom:"20px",display:"flex",gap:"20px",alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
            <span style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",fontWeight:"600"}}>Today's Progress</span>
            <span style={{color:"#4ade80",fontSize:"12px",fontWeight:"700"}}>{todayCompleted} done today</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"4px",height:"5px"}}>
            <div style={{width:`${Math.min(100,(todayCompleted/6)*100)}%`,height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#22c55e,#16a34a)",transition:"width 0.5s ease"}}/>
          </div>
          <div style={{color:"rgba(255,255,255,0.28)",fontSize:"10px",marginTop:"4px"}}>Goal: 6 activities/day  •  All-time: {totalCompleted} completed</div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{color:"#4ade80",fontSize:"28px",fontWeight:"900"}}>{todayCompleted}</div>
          <div style={{color:"rgba(255,255,255,0.3)",fontSize:"10px"}}>today</div>
        </div>
      </div>

      {/* 4-4-4-4 Box Breathing Sanctuary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(16, 185, 129, 0.04) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.22)",
        borderRadius: "16px",
        padding: "20px 24px",
        marginBottom: "22px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
          {/* Left: Interactive Breathing Orb */}
          <div style={{display:"flex",alignItems:"center",gap:"22px"}}>
            <div style={{
              width:"90px",
              height:"90px",
              borderRadius:"50%",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              position:"relative",
              flexShrink:0
            }}>
              {/* Outer Ripple */}
              <div style={{
                position:"absolute",
                inset:0,
                borderRadius:"50%",
                background: `radial-gradient(circle, ${BREATH_PHASES[breathPhaseIndex].color}40 0%, transparent 70%)`,
                animation: breathingActive ? "boxBreathe 16s ease-in-out infinite" : "none",
                transform: breathingActive ? undefined : "scale(1)",
                transition: "all 0.6s ease"
              }}/>
              {/* Inner Glowing Core */}
              <div style={{
                width:"58px",
                height:"58px",
                borderRadius:"50%",
                background: `linear-gradient(135deg, ${BREATH_PHASES[breathPhaseIndex].color}, #6366f1)`,
                boxShadow: `0 0 25px ${BREATH_PHASES[breathPhaseIndex].color}80`,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                zIndex:1,
                transition: "all 0.5s ease"
              }}>
                <span style={{fontSize:"20px"}}>{breathingActive ? (breathPhaseIndex === 0 ? "🌬️" : breathPhaseIndex === 1 ? "🧘" : breathPhaseIndex === 2 ? "💨" : "✨") : "🫁"}</span>
              </div>
            </div>

            {/* Instruction and Stage */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                <span style={{color: BREATH_PHASES[breathPhaseIndex].color, fontSize:"11px", fontWeight:"800", textTransform:"uppercase", letterSpacing:"1.2px"}}>
                  {breathingActive ? `Phase ${breathPhaseIndex + 1}/4` : "Vagus Nerve Reset"}
                </span>
                {breathingActive && (
                  <span style={{background: `${BREATH_PHASES[breathPhaseIndex].color}22`, color: BREATH_PHASES[breathPhaseIndex].color, border: `1px solid ${BREATH_PHASES[breathPhaseIndex].color}44`, borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: "800"}}>
                    {breathSeconds}s
                  </span>
                )}
              </div>
              <h3 style={{color:"white",fontSize:"17px",fontWeight:"800",margin:0}}>
                {breathingActive ? BREATH_PHASES[breathPhaseIndex].label : "Guided 4-4-4-4 Box Breathing"}
              </h3>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"12px",marginTop:"3px",maxWidth:"380px",lineHeight:"1.4"}}>
                {breathingActive ? BREATH_PHASES[breathPhaseIndex].hint : "4s Inhale, 4s Hold, 4s Exhale, 4s Rest to immediately lower somatic tension and soothe cortisol."}
              </p>
            </div>
          </div>

          {/* Right: Controls & Metrics */}
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{textAlign:"right",paddingRight:"12px",borderRight:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{color:"#4ade80",fontSize:"18px",fontWeight:"800"}}>{cyclesCompleted}</div>
              <div style={{color:"rgba(255,255,255,0.35)",fontSize:"10px",textTransform:"uppercase"}}>Cycles Done</div>
            </div>
            <button
              onClick={() => {
                if (!breathingActive) {
                  setBreathPhaseIndex(0);
                  setBreathSeconds(4);
                }
                setBreathingActive(b => !b);
              }}
              style={{
                padding:"10px 18px",
                background: breathingActive ? "rgba(239, 68, 68, 0.16)" : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                border: breathingActive ? "1px solid rgba(239, 68, 68, 0.4)" : "none",
                borderRadius:"10px",
                color: breathingActive ? "#f87171" : "white",
                fontSize:"12px",
                fontWeight:"700",
                cursor:"pointer",
                display:"flex",
                alignItems:"center",
                gap:"6px",
                boxShadow: breathingActive ? "none" : "0 4px 15px rgba(139, 92, 246, 0.35)",
                transition: "all 0.2s ease"
              }}
            >
              {breathingActive ? "⏸ Pause Breathing" : "▶ Start Breathing"}
            </button>
          </div>
        </div>
      </div>

      {matched.length===0&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"32px",textAlign:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>🎯</div>
          <h3 style={{color:"white",fontWeight:"700",fontSize:"15px",marginBottom:"8px"}}>Let's personalise your resources</h3>
          <p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px",marginBottom:"16px"}}>Tell us what you enjoy — chess, jazz, yoga, cooking — and we'll bring those exact resources here.</p>
          <button onClick={onEditInterests} style={{padding:"10px 24px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"10px",color:"white",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>✨ Choose My Interests</button>
        </div>
      )}

      {sections.map(({sectionId,cat,catInterests,leadData,allResources})=>{
        const rotated=getRotatedResources(sectionId,allResources);
        const sectionDoneCount=rotated.filter(r=>completed[`${sectionId}::${r.title}`]).length;
        const accentColor=leadData?.color||"#7c3aed";
        // Which interests in this section have sub-questions?
        const refinableInSection=catInterests; // every interest is refinable via free text
        const hasAnyPrefs=catInterests.some(i=>subInterests[i]&&subInterests[i].trim());
        const totalPrefs=catInterests.filter(i=>subInterests[i]&&subInterests[i].trim()).length;
        const isEditing=catInterests.some(i=>editingSub===i);

        return(
          <div key={sectionId} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${accentColor}22`,borderRadius:"16px",padding:"18px",marginBottom:"18px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                {catInterests.map(i=>{
                  const d=INTEREST_RESOURCES[i];
                  return(
                    <span key={i} style={{display:"inline-flex",alignItems:"center",gap:"4px",background:`${d?.color||accentColor}1a`,border:`1px solid ${d?.color||accentColor}40`,borderRadius:"20px",padding:"3px 10px",color:d?.color||accentColor,fontSize:"12px",fontWeight:"700"}}>
                      {d?.icon} {i}
                    </span>
                  );
                })}
                {sectionDoneCount>0&&<span style={{background:"rgba(34,197,94,0.18)",border:"1px solid rgba(34,197,94,0.35)",borderRadius:"20px",padding:"2px 9px",color:"#4ade80",fontSize:"11px",fontWeight:"700"}}>{sectionDoneCount}/{rotated.length} done</span>}
              </div>
              <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                {refinableInSection.length>0&&(
                  <button onClick={()=>setEditingSub(isEditing?null:refinableInSection[0])} style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",background:hasAnyPrefs||isEditing?`${accentColor}20`:"rgba(255,255,255,0.05)",border:`1px solid ${hasAnyPrefs||isEditing?accentColor+"45":"rgba(255,255,255,0.1)"}`,borderRadius:"8px",color:hasAnyPrefs||isEditing?accentColor:"rgba(255,255,255,0.42)",cursor:"pointer",fontSize:"11px",fontWeight:"600"}}>
                    🎯 {hasAnyPrefs?`${totalPrefs} personalised`:"Personalise"}
                  </button>
                )}
                <button onClick={()=>setSectionKeys(prev=>({...prev,[sectionId]:(prev[sectionId]||0)+1}))} style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"rgba(255,255,255,0.45)",cursor:"pointer",fontSize:"11px",fontWeight:"600"}}>🔄 Refresh</button>
              </div>
            </div>

            <p style={{color:"rgba(255,255,255,0.28)",fontSize:"11px",marginBottom:isEditing?"8px":"13px"}}>
              {catInterests.length===1
                ?`Because you enjoy ${catInterests[0]} — ${leadData?.desc||"curated for you"}`
                :`Curated for your ${catInterests.join(" & ")} interests`}
              {hasAnyPrefs&&<span style={{color:accentColor,fontWeight:"600"}}> · sorted to your preferences</span>}
            </p>

            {/* Inline sub-interest editors for each refinable interest in section */}
            {catInterests.filter(i=>editingSub===i).map(i=>(
              <SubEditor key={i} interest={i} savedValue={typeof subInterests[i]==="string"?subInterests[i]:""} onSave={saveSubInterest} onCancel={()=>setEditingSub(null)} isLoading={!!loadingPersonalise[i]}/>
            ))}

            {/* If section has multiple refinable interests and only one is open, show switch buttons */}
            {isEditing&&refinableInSection.length>1&&(
              <div style={{display:"flex",gap:"6px",marginBottom:"8px"}}>
                {refinableInSection.map(i=>(
                  <button key={i} onClick={()=>setEditingSub(i)} style={{padding:"4px 10px",borderRadius:"20px",fontSize:"11px",cursor:"pointer",border:`1px solid ${editingSub===i?accentColor+"60":"rgba(255,255,255,0.1)"}`,background:editingSub===i?`${accentColor}1a`:"rgba(255,255,255,0.03)",color:editingSub===i?accentColor:"rgba(255,255,255,0.42)",fontWeight:editingSub===i?"700":"400"}}>
                    {INTEREST_RESOURCES[i]?.icon} {i}
                  </button>
                ))}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px"}}>
              {rotated.map(res=>(
                <ResourceCard key={res.title} res={res} sectionId={sectionId} color={accentColor}/>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"18px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"13px"}}>
          <div>
            <h3 style={{color:"white",fontWeight:"800",fontSize:"14px"}}>⚡ Instant Relief Techniques</h3>
            <p style={{color:"rgba(255,255,255,0.3)",fontSize:"11px",marginTop:"2px"}}>Works right now — no setup needed</p>
          </div>
          <button onClick={()=>setQuickDone({})} style={{padding:"5px 11px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"8px",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"12px",fontWeight:"600"}}>🔄 Reset</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"9px"}}>
          {QUICK_TECHNIQUES.map(t=>{
            const done=quickDone[t.title];
            return(
              <div key={t.title} style={{background:done?"rgba(34,197,94,0.07)":"rgba(124,58,237,0.06)",border:`1px solid ${done?"rgba(34,197,94,0.22)":"rgba(124,58,237,0.14)"}`,borderRadius:"11px",padding:"13px",transition:"all 0.17s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"5px"}}>
                  <span style={{fontSize:"18px"}}>{done?"✅":t.icon}</span>
                  <span style={{background:"rgba(255,255,255,0.07)",borderRadius:"20px",padding:"1px 7px",color:"rgba(255,255,255,0.32)",fontSize:"10px"}}>{t.time}</span>
                </div>
                <div style={{color:done?"#4ade80":"white",fontSize:"12px",fontWeight:"700",marginBottom:"4px"}}>{t.title}</div>
                <p style={{color:"rgba(255,255,255,0.45)",fontSize:"11px",lineHeight:"1.35",margin:"0 0 9px"}}>{t.desc}</p>
                <button onClick={()=>{const nowDone=!done;setQuickDone(p=>({...p,[t.title]:nowDone}));if(nowDone)onActivityComplete({date:new Date().toISOString(),interestKey:"Quick Technique",resourceTitle:t.title});}} style={{width:"100%",padding:"6px 8px",background:done?"rgba(34,197,94,0.22)":"rgba(124,58,237,0.18)",border:`1px solid ${done?"rgba(34,197,94,0.4)":"rgba(124,58,237,0.35)"}`,borderRadius:"7px",color:done?"#4ade80":"#c4b5fd",fontSize:"11px",fontWeight:"700",cursor:"pointer",transition:"all 0.15s"}}>
                  {done?"✓ Done — undo":"Mark as done"}
                </button>
              </div>
            );
          })}
        </div>
        {Object.values(quickDone).filter(Boolean).length>0&&(
          <div style={{marginTop:"10px",background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:"8px",padding:"8px 13px",fontSize:"12px",color:"#4ade80"}}>
            🎉 {Object.values(quickDone).filter(Boolean).length} technique{Object.values(quickDone).filter(Boolean).length>1?"s":""} done today!
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Chat ─────────────────────────────────────────────────────────────────────
function Chat({user,risk,onChatSignal}){
  const interests=user.interests||[];
  const[msgs,setMsgs]=useState([{role:"assistant",content:`Hi ${user.name}! I'm Deprex AI 💙\n\nI know you enjoy ${interests.slice(0,3).join(", ")||"various activities"} — I'll weave those into my suggestions to help you feel better.\n\nHow are you feeling right now?`}]);
  const[input,setInput]=useState("");
  const[busy,setBusy]=useState(false);
  const[crisisAlert,setCrisisAlert]=useState(false);
  const endRef=useRef(null);
  const ri=riskInfo(risk);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  useEffect(() => {
    let active = true;
    getChatHistory()
      .then((data) => {
        if (active && data.messages && data.messages.length > 0) {
          setMsgs(data.messages.map((m) => ({ role: m.role, content: m.content })));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  const send=async(text)=>{
    const msg=text||input; if(!msg.trim()||busy)return;
    setInput("");

    // Analyse silently — user never sees this, only affects graphs + crisis alert
    const signal=analyzeChatMessage(msg);
    if(signal.level==="crisis") setCrisisAlert(true);
    if(signal.riskDelta!==0||signal.moodDelta!==0){
      onChatSignal({date:new Date().toISOString(), level:signal.level, riskDelta:signal.riskDelta, moodDelta:signal.moodDelta, flags:signal.flags});
    }

    const updated=[...msgs,{role:"user",content:msg}];
    setMsgs(updated);
    setBusy(true);
    const reply=await callAI(updated,risk,interests);
    setMsgs([...updated,{role:"assistant",content:reply}]);
    setBusy(false);
  };

  const quick=interests.length?[`How can ${interests[0]} help my mood?`,"I feel overwhelmed","I can't relax","I feel anxious","Help me sleep","Breathing exercise"]:["I feel overwhelmed","I can't relax","I feel anxious","Help me sleep","I feel lonely","Breathing exercise"];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",padding:"20px 26px",position:"relative"}}>

      {/* ── Crisis Alert Banner ────────────────────────────────────────────── */}
      {crisisAlert&&(
        <div style={{position:"absolute",top:0,left:0,right:0,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.5)",borderRadius:"0 0 14px 14px",padding:"14px 20px",zIndex:100,backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                <span style={{fontSize:"18px"}}>🚨</span>
                <strong style={{color:"#f87171",fontSize:"14px"}}>We noticed some concerning thoughts</strong>
              </div>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:"12px",lineHeight:"1.5",margin:"0 0 10px"}}>
                You're not alone — help is available right now. These resources are free and confidential:
              </p>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <a href="tel:988" style={{padding:"7px 13px",background:"rgba(239,68,68,0.25)",border:"1px solid rgba(239,68,68,0.5)",borderRadius:"8px",color:"#f87171",textDecoration:"none",fontSize:"13px",fontWeight:"700"}}>📞 Call/Text 988 — Crisis Lifeline</a>
                <a href="sms:741741?body=HELLO" style={{padding:"7px 13px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:"8px",color:"#f87171",textDecoration:"none",fontSize:"13px",fontWeight:"600"}}>💬 Text HOME to 741741</a>
                <a href="https://988lifeline.org/chat" target="_blank" rel="noopener noreferrer" style={{padding:"7px 13px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",color:"#f87171",textDecoration:"none",fontSize:"13px"}}>🌐 Online Chat</a>
              </div>
            </div>
            <button onClick={()=>setCrisisAlert(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"6px",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"11px",padding:"4px 9px",flexShrink:0}}>✕</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"11px",marginTop:crisisAlert?"110px":"0",transition:"margin-top 0.3s"}}>
        <div>
          <h1 style={{color:"white",fontSize:"20px",fontWeight:"800"}}>💬 AI Support Chat</h1>
          <p style={{color:"rgba(255,255,255,0.3)",fontSize:"12px"}}>Personalized to your interests • Empathetic • Confidential</p>
        </div>
        <div style={{background:ri.bg,border:`1px solid ${ri.border}`,borderRadius:"9px",padding:"6px 11px",textAlign:"right"}}>
          <div style={{color:"rgba(255,255,255,0.3)",fontSize:"10px"}}>Risk Level</div>
          <div style={{color:ri.color,fontWeight:"700",fontSize:"12px"}}>{ri.label}</div>
        </div>
      </div>

      <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.16)",borderRadius:"8px",padding:"7px 12px",marginBottom:"11px",fontSize:"11px",color:"rgba(255,255,255,0.36)"}}>
        ⚕️ AI support only — not medical advice. Emergencies: <strong style={{color:"#a78bfa"}}>988</strong> or <strong style={{color:"#a78bfa"}}>911</strong>.
      </div>

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"9px",marginBottom:"9px"}}>
        {msgs.map((m,i)=>{
          const isUser=m.role==="user";
          return(
            <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",alignItems:"flex-start",gap:"7px"}}>
              {!isUser&&<div style={{width:"25px",height:"25px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",flexShrink:0,marginTop:"2px"}}>🧠</div>}
              <div style={{maxWidth:"74%",padding:"10px 13px",borderRadius:isUser?"13px 13px 3px 13px":"13px 13px 13px 3px",background:isUser?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.06)",border:isUser?"none":"1px solid rgba(255,255,255,0.08)",color:"white",fontSize:"13px",lineHeight:"1.55",whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          );
        })}
        {busy&&<div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:"25px",height:"25px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>🧠</div><div style={{background:"rgba(255,255,255,0.06)",borderRadius:"13px",padding:"10px 13px",display:"flex",gap:"4px"}}>{[0,1,2].map(d=><div key={d} style={{width:"6px",height:"6px",borderRadius:"50%",background:"#7c3aed",animation:"bop 1.2s ease-in-out infinite",animationDelay:`${d*0.2}s`}}/>)}</div></div>}
        <div ref={endRef}/>
      </div>

      <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>{quick.map(p=><button key={p} onClick={()=>send(p)} style={{padding:"4px 9px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.24)",borderRadius:"20px",color:"#c4b5fd",fontSize:"11px",cursor:"pointer"}}>{p}</button>)}</div>
      <div style={{display:"flex",gap:"7px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Share how you're feeling..." style={{flex:1,padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"10px",color:"white",fontSize:"13px",outline:"none"}}/>
        <button onClick={()=>send()} disabled={!input.trim()||busy} style={{padding:"11px 15px",background:input.trim()&&!busy?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.05)",border:"none",borderRadius:"10px",color:input.trim()&&!busy?"white":"rgba(255,255,255,0.22)",cursor:input.trim()&&!busy?"pointer":"not-allowed",fontSize:"15px"}}>➤</button>
      </div>
      <style>{`@keyframes bop{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function Deprex(){
  const[user,setUser]=useState(null);
  const[tab,setTab]=useState("dashboard");
  const[reliefEvents,setReliefEvents]=useState([]);
  const[chatEvents,setChatEvents]=useState([]);
  const[journals,setJournals]=useState([]);
  const[assessHistory,setAssessHistory]=useState([]);
  const[loading,setLoading]=useState(true);

  // ── Boot: restore session from saved JWT ──────────────────────────────────
  useEffect(()=>{
    const token=localStorage.getItem("dx_token");
    if(!token){setLoading(false);return;}
    apiFetch("/auth/me").then(u=>{
      setUser(u);
      return Promise.all([
        apiFetch("/journal/"),
        apiFetch("/assessment/latest"),
        apiFetch("/relief-events"),
        apiFetch("/chat-events"),
      ]);
    }).then(([jnls,latestAssess,relief,chat])=>{
      setJournals(jnls||[]);
      if(latestAssess) setAssessHistory([latestAssess]);
      setReliefEvents(relief||[]);
      setChatEvents(chat||[]);
    }).catch(()=>{
      localStorage.removeItem("dx_token");
    }).finally(()=>setLoading(false));
  },[]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleAuth=async(u)=>{
    setUser(u);
    try{
      const[jnls,latestAssess,relief,chat]=await Promise.all([
        apiFetch("/journal/"),
        apiFetch("/assessment/latest"),
        apiFetch("/relief-events"),
        apiFetch("/chat-events"),
      ]);
      setJournals(jnls||[]);
      if(latestAssess) setAssessHistory([latestAssess]);
      setReliefEvents(relief||[]);
      setChatEvents(chat||[]);
    }catch{}
  };

  const handleLogout=()=>{
    localStorage.removeItem("dx_token");
    setUser(null);setTab("dashboard");
    setJournals([]);setAssessHistory([]);setReliefEvents([]);setChatEvents([]);
  };

  // ── Interests ─────────────────────────────────────────────────────────────
  const saveInterests=async(interests,subInterests={})=>{
    try{
      await apiFetch("/user/interests",{method:"PUT",body:{interests,sub_interests:subInterests,onboarded:true}});
      setUser(u=>({...u,interests,subInterests,onboarded:true}));
      setTab("relief");
    }catch(e){alert("Could not save interests: "+e.message);}
  };

  // ── Journal ───────────────────────────────────────────────────────────────
  const saveJournal=async(entry)=>{
    try{
      const saved=await apiFetch("/journal/",{method:"POST",body:{content:entry.text}});
      // Merge backend sentiment with frontend emotion detection
      const enriched={...entry, id:saved.id, sentiment:{...entry.sentiment, score:(saved.sentiment+1)/2}, date:saved.createdAt};
      setJournals(prev=>[enriched,...prev]);
      setUser(u=>({...u,journals:[enriched,...(u.journals||[])]}));
    }catch{}
  };

  // ── Assessment ────────────────────────────────────────────────────────────
  const saveAssessment=async(result)=>{
    try{
      const saved=await apiFetch("/assessment/",{method:"POST",body:{score:result.score,risk:result.risk,answers:result.answers||[]}});
      const enriched={...result,...saved};
      setAssessHistory([enriched]);
      setUser(u=>({...u,assessments:[enriched]}));
    }catch{}
  };

  // ── Events ────────────────────────────────────────────────────────────────
  const handleActivityComplete=async(event)=>{
    setReliefEvents(prev=>[...prev,event]);
    try{ await apiFetch("/relief-events",{method:"POST",body:{interest_key:event.interestKey,resource_title:event.resourceTitle}}); }catch{}
  };

  const handleChatSignal=async(event)=>{
    setReliefEvents(prev=>[...prev,event]);
    setChatEvents(prev=>[...prev,event]);
    try{ await apiFetch("/chat-events",{method:"POST",body:{level:event.level,risk_delta:event.riskDelta,mood_delta:event.moodDelta,flags:event.flags||[]}}); }catch{}
  };

  // ── Risk ──────────────────────────────────────────────────────────────────
  const latestAssess=assessHistory[assessHistory.length-1];
  const avgSent=journals.length?journals.reduce((a,j)=>a+(j.sentiment?.score??0.5),0)/journals.length:0.5;
  const recentChatEvents=chatEvents.slice(-10);
  const chatRiskDelta=Math.min(0.35,Math.max(-0.15,recentChatEvents.reduce((sum,e)=>sum+(e.riskDelta||0),0)));
  const activityBonus=Math.min(0.25,reliefEvents.length*0.012);
  const baseRisk=latestAssess?computeRisk(latestAssess.score,avgSent,journals.length):0.15;
  const risk=Math.min(0.97,Math.max(0.03,baseRisk+chatRiskDelta-activityBonus));

  const bg={minHeight:"100vh",background:"radial-gradient(ellipse at 25% 15%, rgba(139, 92, 246, 0.12) 0%, #080811 50%, #0a1120 100%)",color:"white",fontFamily:"'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};

  if(loading) return(
    <div style={{...bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
      <div style={{fontSize:"40px"}}>🧠</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:"14px"}}>Loading Deprex…</div>
    </div>
  );

  if(!user) return <div style={bg}><Auth onAuth={handleAuth}/></div>;
  if(!user.onboarded) return <div style={bg}><InterestPicker user={user} initialInterests={[]} isEdit={false} onComplete={saveInterests}/></div>;

  return(
    <div style={{...bg,display:"flex",overflow:"hidden"}}>
      <Sidebar tab={tab} setTab={setTab} user={user} logout={handleLogout} risk={risk}/>
      <div style={{flex:1,overflow:"hidden"}}>
        {tab==="dashboard"&&<Dashboard user={user} risk={risk} journals={journals} assessHistory={assessHistory} reliefEvents={reliefEvents} chatEvents={chatEvents} setTab={setTab}/>}
        {tab==="journal"&&<Journal user={user} journals={journals} onSave={saveJournal}/>}
        {tab==="assess"&&<Assessment onSave={saveAssessment} history={assessHistory}/>}
        {tab==="relief"&&<StressRelief user={user} onActivityComplete={handleActivityComplete} onEditInterests={()=>setTab("editInterests")}/>}
        {tab==="chat"&&<Chat user={user} risk={risk} onChatSignal={handleChatSignal}/>}
        {tab==="editInterests"&&(
          <InterestPicker
            user={user}
            initialInterests={user.interests||[]}
            initialSubInterests={user.subInterests||{}}
            isEdit={true}
            onComplete={saveInterests}
            onCancel={()=>setTab("relief")}
          />
        )}
      </div>
    </div>
  );
}
