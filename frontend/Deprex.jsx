import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const QUICK_TECHNIQUES = [
  { icon:"🌬️", title:"Box Breathing", desc:"Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4x.", time:"2 min" },
  { icon:"🌊", title:"5-4-3-2-1 Grounding", desc:"Name 5 things you see, 4 hear, 3 touch, 2 smell, 1 taste.", time:"3 min" },
  { icon:"🧘", title:"Progressive Muscle Relax", desc:"Tense each muscle group 5s then release, toes to head.", time:"5 min" },
  { icon:"💧", title:"Cold Water Reset", desc:"Splash cold water on face — resets the nervous system instantly.", time:"1 min" },
  { icon:"✍️", title:"Worry Dump", desc:"Write every worry uncensored on paper — getting it out reduces it.", time:"5 min" },
  { icon:"☀️", title:"Sunlight Break", desc:"Step outside for 5 minutes. Natural light boosts serotonin and mood.", time:"5 min" },
];

// ─── AI-powered personalised resource fetcher ─────────────────────────────────
// Given user's free-text description of what they like within an interest,
// calls Claude to reorder/recommend the best matching resources from the pool.
// ─── API client ───────────────────────────────────────────────────────────────
const API = "http://localhost:8000";
function getToken(){ return localStorage.getItem("dx_token") || ""; }
async function apiFetch(path, opts={}){
  try {
    const res = await fetch(API+path, {
      ...opts,
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${getToken()}`, ...(opts.headers||{}) },
      body: opts.body ? (typeof opts.body==="string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
    if(!res.ok){ const e=await res.json().catch(()=>({})); throw new Error(e.detail||res.statusText); }
    return res.json();
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Cannot connect to backend server. Please make sure FastAPI backend is running on http://localhost:8000.");
    }
    throw err;
  }
}

async function getPersonalisedResources(interest, userDescription, existingResources) {
  if (!userDescription || !userDescription.trim()) return existingResources;
  try {
    const data = await apiFetch("/ai/personalise", { method:"POST", body:{ interest, description:userDescription, resources:existingResources } });
    const order = data.order || [];
    return order.map(i => existingResources[i]).filter(Boolean);
  } catch { return existingResources; }
}


const INTEREST_CATEGORIES = [
  { category:"Puzzles & Brain Games", icon:"🧩", items:[
    "Chess","Sudoku","Crosswords","Word Games","Jigsaw Puzzles","Logic Puzzles","Trivia & Quizzes","Rubik's Cube","Math Puzzles","Brain Training",
  ]},
  { category:"Creative Arts", icon:"🎨", items:[
    "Drawing & Sketching","Watercolor Painting","Digital Art","Photography","Writing & Poetry","Calligraphy","Crafts & DIY","Journaling",
  ]},
  { category:"Music & Audio", icon:"🎵", items:[
    "Classical Music","Jazz & Blues","Lo-fi & Ambient","Pop & Indie","Rock & Metal","Nature Sounds","Podcasts","Audiobooks","Playing Guitar","Playing Piano",
  ]},
  { category:"Screen & Stories", icon:"🎬", items:[
    "Movies & Series","Anime","Stand-up Comedy","Documentaries","True Crime","Manga & Comics","Gaming","Video Essays",
  ]},
  { category:"Mind & Wellness", icon:"🧘", items:[
    "Meditation","Yoga","Reading Books","Philosophy","Stoicism","Mindfulness","Breathwork","Journaling",
  ]},
  { category:"Physical & Outdoors", icon:"🏃", items:[
    "Running & Jogging","Gym & Fitness","Dancing","Hiking","Cycling","Swimming","Sports","Martial Arts",
  ]},
  { category:"Learning & Growth", icon:"📚", items:[
    "Learning Languages","Science & Nature","History","Astronomy","Psychology","Coding & Tech","Online Courses","Math",
  ]},
  { category:"Food & Lifestyle", icon:"🍳", items:[
    "Cooking & Baking","Coffee & Tea","Gardening","Trying New Recipes","Home Decor","Travel","Shopping",
  ]},
  { category:"Social & Community", icon:"🤝", items:[
    "Pets & Animals","Board Games","Spending Time with Friends","Volunteering","Attending Events","Online Communities",
  ]},
];

// ─── INTEREST RESOURCE DATABASE (interest-specific) ───────────────────────────
// Each key maps to tailored resources for that exact interest
const INTEREST_RESOURCES = {
  // ── Puzzles & Brain Games ──────────────────────────────────────────────────
  "Chess": { icon:"♟️", color:"#6d28d9", desc:"Play chess online — free, no account needed", resources:[
    { type:"embed", title:"Chess.com — Play Free", note:"World's #1 chess site. Play against bots or friends", thumb:"♟️", url:"https://www.chess.com/play/computer", cta:"Play Chess" },
    { type:"embed", title:"Lichess — Open Source Chess", note:"100% free, no ads, no account required", thumb:"♜", url:"https://lichess.org", cta:"Play on Lichess" },
    { type:"link", title:"Chess Puzzles (Lichess)", note:"Solve daily tactical puzzles — great for focus", thumb:"🧩", url:"https://lichess.org/training", cta:"Solve Puzzles" },
    { type:"link", title:"Chess Tempo — Tactics", note:"Train your tactical pattern recognition", thumb:"⚡", url:"https://chesstempo.com", cta:"Train Tactics" },
  ]},
  "Sudoku": { icon:"🔢", color:"#7c3aed", desc:"Play Sudoku directly in your browser", resources:[
    { type:"embed", title:"Puzzle Sudoku", note:"Daily Sudoku puzzles — easy to expert", thumb:"🔢", url:"https://www.puzzle-sudoku.com", cta:"Play Sudoku" },
    { type:"embed", title:"Web Sudoku", note:"Billions of Sudoku puzzles free", thumb:"📐", url:"https://www.websudoku.com", cta:"Play Now" },
    { type:"link", title:"Sudoku.com", note:"Beautiful Sudoku app — all difficulty levels", thumb:"🎮", url:"https://sudoku.com", cta:"Open App" },
    { type:"link", title:"Daily Sudoku", note:"One fresh Sudoku puzzle every day", thumb:"📅", url:"https://www.dailysudoku.com/sudoku/", cta:"Today's Puzzle" },
  ]},
  "Crosswords": { icon:"✏️", color:"#0891b2", desc:"Crossword puzzles for every level", resources:[
    { type:"embed", title:"Boatload Crosswords", note:"Thousands of free crossword puzzles", thumb:"✏️", url:"https://www.boatloadpuzzles.com/playcrossword", cta:"Play Crossword" },
    { type:"link", title:"NYT Mini Crossword (Free)", note:"Quick 5×5 crossword — perfect daily brain warm-up", thumb:"📰", url:"https://www.nytimes.com/crosswords/game/mini", cta:"Play Mini Crossword" },
    { type:"link", title:"Washington Post Crossword", note:"Free daily crossword from the Washington Post", thumb:"📝", url:"https://www.washingtonpost.com/crossword-puzzles/daily/", cta:"Play Free" },
    { type:"link", title:"Crossword Nexus", note:"Search thousands of free crosswords by theme", thumb:"🔍", url:"https://crosswordnexus.com", cta:"Browse Crosswords" },
  ]},
  "Word Games": { icon:"🔤", color:"#16a34a", desc:"Word games to keep your mind sharp", resources:[
    { type:"embed", title:"Wordle — Play Free", note:"The famous daily word guessing game", thumb:"🟩", url:"https://www.nytimes.com/games/wordle/index.html", cta:"Play Wordle" },
    { type:"link", title:"Semantle", note:"Find the secret word using semantic similarity", thumb:"🧠", url:"https://semantle.com", cta:"Play Semantle" },
    { type:"link", title:"Connections (NYT)", note:"Group words by hidden category — daily challenge", thumb:"🔗", url:"https://www.nytimes.com/games/connections", cta:"Play Connections" },
    { type:"link", title:"Free Rice", note:"Vocabulary quiz that donates rice to charity", thumb:"🌾", url:"https://freerice.com", cta:"Play & Give" },
  ]},
  "Jigsaw Puzzles": { icon:"🧩", color:"#f97316", desc:"Relaxing jigsaw puzzles in your browser", resources:[
    { type:"embed", title:"Jigsaw Planet", note:"Hundreds of beautiful jigsaw puzzles — all free", thumb:"🧩", url:"https://www.jigsawplanet.com", cta:"Play Jigsaw" },
    { type:"embed", title:"Jigsaw Explorer", note:"Real photos turned into soothing jigsaws", thumb:"🖼️", url:"https://www.jigsawexplorer.com", cta:"Play Now" },
    { type:"link", title:"Puzzle Factory", note:"Create your own jigsaw from any photo", thumb:"✨", url:"https://www.jigidi.com", cta:"Make a Puzzle" },
    { type:"link", title:"Magic Jigsaw Puzzles", note:"Free app with thousands of HD jigsaws", thumb:"📱", url:"https://www.magicjigsawpuzzles.com", cta:"Get App Free" },
  ]},
  "Logic Puzzles": { icon:"🔍", color:"#7c3aed", desc:"Logic and reasoning puzzles for calm focus", resources:[
    { type:"link", title:"Puzzle Baron Logic Puzzles", note:"Classic grid-based logic puzzles, free to play", thumb:"🔍", url:"https://logic.puzzlebaron.com", cta:"Solve Puzzles" },
    { type:"embed", title:"Nonograms / Picross", note:"Pixel logic puzzles — relaxing and rewarding", thumb:"🎨", url:"https://www.nonograms.org", cta:"Play Nonograms" },
    { type:"link", title:"Flow Free (Browser)", note:"Connect matching colors — deeply calming", thumb:"🌈", url:"https://www.crazygames.com/game/flow-free", cta:"Play Flow Free" },
    { type:"link", title:"Kakuro Puzzles", note:"Mathematical crosswords — unique logic challenge", thumb:"🔢", url:"https://www.kakuroconquest.com", cta:"Play Kakuro" },
  ]},
  "Trivia & Quizzes": { icon:"❓", color:"#0891b2", desc:"Fun trivia and knowledge quizzes", resources:[
    { type:"link", title:"Sporcle", note:"Thousands of free trivia quizzes on any topic", thumb:"❓", url:"https://www.sporcle.com", cta:"Play Trivia" },
    { type:"link", title:"Kahoot (Solo)", note:"Play fun knowledge challenges solo or with friends", thumb:"🎮", url:"https://kahoot.com", cta:"Play Now" },
    { type:"embed", title:"Open Trivia Database", note:"Random trivia questions — customizable difficulty", thumb:"🎯", url:"https://opentdb.com/quiz_generator.php", cta:"Generate Quiz" },
    { type:"link", title:"QuizUp — Free", note:"Challenge yourself on topics you love", thumb:"⚡", url:"https://quizup.com", cta:"Take a Quiz" },
  ]},
  "Brain Training": { icon:"🧠", color:"#7c3aed", desc:"Games designed to train memory, speed, and focus", resources:[
    { type:"link", title:"Lumosity — Free Plan", note:"Science-backed brain training games", thumb:"🧠", url:"https://www.lumosity.com", cta:"Train Your Brain" },
    { type:"embed", title:"Dual N-Back Game", note:"Working memory trainer — proven cognitive benefits", thumb:"⚡", url:"https://www.brainscale.net/dual-n-back", cta:"Play Now" },
    { type:"link", title:"Elevate — Free", note:"Daily brain training for focus and memory", thumb:"🎯", url:"https://www.elevateapp.com", cta:"Try Free" },
    { type:"link", title:"Human Benchmark", note:"Test your reaction time, memory, and attention", thumb:"📊", url:"https://humanbenchmark.com", cta:"Benchmark Yourself" },
  ]},
  "Rubik's Cube": { icon:"🎲", color:"#f59e0b", desc:"Solve and learn the Rubik's Cube", resources:[
    { type:"embed", title:"Play Rubik's Cube Online", note:"Full 3D Rubik's cube in your browser", thumb:"🎲", url:"https://rubiks.com/solve/", cta:"Solve Online" },
    { type:"link", title:"Ruwix — Beginner Tutorial", note:"Step-by-step guide to solve any cube", thumb:"📖", url:"https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/", cta:"Learn to Solve" },
    { type:"link", title:"CS Timer — Speed Training", note:"Time your solves and track your progress", thumb:"⏱️", url:"https://cstimer.net", cta:"Start Timing" },
    { type:"link", title:"Speedsolving Wiki", note:"Algorithms, methods, and community resources", thumb:"🔬", url:"https://www.speedsolving.com/wiki/", cta:"Explore Wiki" },
  ]},
  // ── Creative Arts ──────────────────────────────────────────────────────────
  "Drawing & Sketching": { icon:"✏️", color:"#d97706", desc:"Draw directly in your browser — no tools needed", resources:[
    { type:"embed", title:"AutoDraw by Google", note:"AI-assisted drawing — relaxing and fun", thumb:"✏️", url:"https://www.autodraw.com", cta:"Start Drawing" },
    { type:"embed", title:"Sketchbook Online", note:"Professional-grade drawing tool in your browser", thumb:"🎨", url:"https://www.sketchbook.com", cta:"Open Sketchbook" },
    { type:"link", title:"Zentangle Tutorials", note:"Mindful pattern drawing — deeply meditative", thumb:"🔮", url:"https://www.youtube.com/results?search_query=zentangle+tutorial+beginner+relaxing", cta:"Watch Tutorial" },
    { type:"link", title:"Sketch Daily Prompts", note:"Reddit community with daily drawing prompts", thumb:"📝", url:"https://www.reddit.com/r/SketchDaily", cta:"Get a Prompt" },
  ]},
  "Digital Art": { icon:"🎨", color:"#7c3aed", desc:"Create digital art right in your browser", resources:[
    { type:"embed", title:"Pixilart", note:"Fun pixel art creator — relaxing and satisfying", thumb:"🟦", url:"https://www.pixilart.com/draw", cta:"Make Pixel Art" },
    { type:"link", title:"Canva Free", note:"Design mood boards, art, cards — all free", thumb:"🎨", url:"https://www.canva.com", cta:"Create on Canva" },
    { type:"link", title:"Chrome Canvas", note:"Simple beautiful drawing by Google", thumb:"✨", url:"https://canvas.apps.chrome", cta:"Open Canvas" },
    { type:"link", title:"Krita (Free)", note:"Professional digital painting — completely free", thumb:"🖌️", url:"https://krita.org", cta:"Download Free" },
  ]},
  "Photography": { icon:"📸", color:"#0891b2", desc:"Photography inspiration and editing tools", resources:[
    { type:"link", title:"Unsplash", note:"Photography inspiration or share your own work", thumb:"🌅", url:"https://unsplash.com", cta:"Browse Photos" },
    { type:"link", title:"Photo A Day Challenge", note:"Daily prompts to spark your creativity", thumb:"📅", url:"https://www.instagram.com/explore/tags/photoaday/", cta:"Get Inspired" },
    { type:"link", title:"Snapseed Online", note:"Google's free professional photo editor", thumb:"✨", url:"https://snapseed.online", cta:"Edit Photos Free" },
    { type:"link", title:"Photzy Free Guides", note:"Free photography guides for all levels", thumb:"📖", url:"https://photzy.com/free-photography-guides", cta:"Learn Photography" },
  ]},
  "Writing & Poetry": { icon:"✍️", color:"#be185d", desc:"Writing prompts and creative tools", resources:[
    { type:"link", title:"750words.com", note:"Private daily writing space — no judgment, just flow", thumb:"📝", url:"https://750words.com", cta:"Start Writing" },
    { type:"link", title:"Writing Prompts (Reddit)", note:"Daily creative writing prompts from a huge community", thumb:"💡", url:"https://www.reddit.com/r/WritingPrompts", cta:"Get a Prompt" },
    { type:"link", title:"Poetry Foundation", note:"Read thousands of poems — find one that speaks to you", thumb:"🌸", url:"https://www.poetryfoundation.org/poems/poem-of-the-day", cta:"Read Today's Poem" },
    { type:"link", title:"NaNoWriMo", note:"Free writing community — tools and support", thumb:"📚", url:"https://nanowrimo.org", cta:"Join Community" },
  ]},
  "Journaling": { icon:"📓", color:"#0891b2", desc:"Private journaling tools and prompts", resources:[
    { type:"link", title:"Penzu Free Journal", note:"Private, secure online journal", thumb:"🔒", url:"https://penzu.com", cta:"Start Journal" },
    { type:"link", title:"100 Mental Health Prompts", note:"Curated prompts for emotional wellbeing", thumb:"💭", url:"https://positivepsychology.com/journaling-prompts-mental-health/", cta:"Get Prompts" },
    { type:"link", title:"Day One App", note:"Beautiful journaling app with daily prompts", thumb:"☀️", url:"https://dayoneapp.com", cta:"Try Day One" },
    { type:"link", title:"Reflectly", note:"AI-guided journaling for emotional wellness", thumb:"🌙", url:"https://reflectly.app", cta:"Try Reflectly" },
  ]},
  // ── Music & Audio ──────────────────────────────────────────────────────────
  "Classical Music": { icon:"🎻", color:"#7c3aed", desc:"Classical music for calm, focus, and mood lift", resources:[
    { type:"link", title:"IDAGIO — Free Classical Streaming", note:"World's best classical music platform — free tier", thumb:"🎻", url:"https://www.idagio.com", cta:"Listen Free" },
    { type:"link", title:"Classic FM Radio", note:"24/7 live classical music radio online", thumb:"📻", url:"https://www.classicfm.com/radio/", cta:"Listen Live" },
    { type:"link", title:"Open Culture — Classical", note:"Free classical music recordings legally online", thumb:"🎓", url:"https://www.openculture.com/freeclassicalmusicrecordings", cta:"Browse Free" },
    { type:"link", title:"Spotify — Classical Focus", note:"Curated classical playlists for focus and calm", thumb:"🟢", url:"https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0", cta:"Open Spotify" },
  ]},
  "Jazz & Blues": { icon:"🎷", color:"#d97706", desc:"Jazz and blues to soothe and uplift", resources:[
    { type:"link", title:"Jazz24 — Live Radio", note:"24/7 live jazz radio, completely free", thumb:"🎷", url:"https://www.jazz24.org", cta:"Listen Live" },
    { type:"link", title:"KCSM Jazz 91 Online", note:"Award-winning Bay Area jazz radio online", thumb:"📻", url:"https://www.kcsm.org", cta:"Stream Now" },
    { type:"link", title:"Spotify — Jazz Vibes", note:"Relaxing jazz playlist perfect for unwinding", thumb:"🟢", url:"https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT", cta:"Open Spotify" },
    { type:"link", title:"YouTube — Jazz Cafe Live", note:"Beautiful jazz café ambience stream on YouTube", thumb:"📺", url:"https://www.youtube.com/results?search_query=jazz+cafe+music+live+relaxing", cta:"Watch on YouTube" },
  ]},
  "Lo-fi & Ambient": { icon:"🎶", color:"#7c3aed", desc:"Lo-fi streams and ambient sound generators", resources:[
    { type:"embed", title:"Lofi.cafe", note:"Beautiful lo-fi radio with rotating café scenes", thumb:"☕", url:"https://www.lofi.cafe", cta:"Open Lofi.cafe" },
    { type:"link", title:"Noisli", note:"Mix your own ambient sounds — rain, forest, café", thumb:"🎚️", url:"https://www.noisli.com", cta:"Mix Sounds" },
    { type:"link", title:"A Soft Murmur", note:"Blend ambient sounds for your perfect backdrop", thumb:"🌿", url:"https://asoftmurmur.com", cta:"Create Ambience" },
    { type:"link", title:"Chillhop Music (YouTube)", note:"Official lo-fi radio — always playing", thumb:"🎵", url:"https://www.youtube.com/watch?v=5yx6BWlEVcY", cta:"Watch on YouTube" },
  ]},
  "Nature Sounds": { icon:"🌿", color:"#16a34a", desc:"Immersive nature soundscapes for calm", resources:[
    { type:"embed", title:"Rain.today", note:"Adjustable rain intensity — incredibly calming", thumb:"🌧️", url:"https://rain.today", cta:"Hear the Rain" },
    { type:"link", title:"MyNoise — Forest Walk", note:"Interactive forest soundscape you can customize", thumb:"🌲", url:"https://mynoise.net/NoiseMachines/jungleNoiseMachine.php", cta:"Enter the Forest" },
    { type:"link", title:"8-Hour Nature Sounds", note:"Long-form nature audio for background calm", thumb:"📺", url:"https://www.youtube.com/results?search_query=8+hour+nature+sounds+relaxing", cta:"Find on YouTube" },
    { type:"link", title:"Calm.com Sounds", note:"Rainstorms, ocean waves, and birdsong", thumb:"🌊", url:"https://www.calm.com/meditate", cta:"Open Calm" },
  ]},
  "Podcasts": { icon:"🎙️", color:"#9333ea", desc:"Mental health and wellness podcasts", resources:[
    { type:"link", title:"The Happiness Lab", note:"Yale prof Dr. Laurie Santos on the science of happiness", thumb:"😊", url:"https://www.pushkin.fm/podcasts/the-happiness-lab-with-dr-laurie-santos", cta:"Listen Now" },
    { type:"link", title:"Ten Percent Happier", note:"Practical mindfulness for skeptics", thumb:"🧘", url:"https://www.tenpercent.com/podcast", cta:"Listen Now" },
    { type:"link", title:"Huberman Lab", note:"Science-based tools for mental health and performance", thumb:"🧠", url:"https://www.hubermanlab.com/podcast", cta:"Listen Now" },
    { type:"link", title:"Unlocking Us — Brené Brown", note:"Conversations on vulnerability and connection", thumb:"💜", url:"https://brenebrown.com/podcast/", cta:"Listen Now" },
  ]},
  "Audiobooks": { icon:"🎧", color:"#0891b2", desc:"Free audiobooks to listen to right now", resources:[
    { type:"link", title:"LibriVox", note:"Free public domain audiobooks read by volunteers", thumb:"🎙️", url:"https://librivox.org", cta:"Listen Free" },
    { type:"link", title:"Loyal Books", note:"Free audiobooks and ebooks — great selection", thumb:"📻", url:"https://www.loyalbooks.com", cta:"Browse Audiobooks" },
    { type:"link", title:"Open Culture — 800+ Audiobooks", note:"Classic literature and philosophy as free audio", thumb:"🎓", url:"https://www.openculture.com/freeaudiobooks", cta:"Explore Collection" },
    { type:"link", title:"Thoughtaudio", note:"Philosophy and literature as calming free audio", thumb:"💭", url:"https://thoughtaudio.com", cta:"Listen Now" },
  ]},
  "Playing Guitar": { icon:"🎸", color:"#f59e0b", desc:"Free guitar lessons for all levels", resources:[
    { type:"link", title:"JustinGuitar — Free Lessons", note:"World's most trusted free guitar lessons", thumb:"🎸", url:"https://www.justinguitar.com", cta:"Learn Guitar Free" },
    { type:"link", title:"Yousician — Free Tier", note:"Interactive guitar learning with real feedback", thumb:"🎮", url:"https://yousician.com", cta:"Start Learning" },
    { type:"link", title:"Ultimate Guitar Tabs", note:"Chord charts and tabs for any song", thumb:"📄", url:"https://www.ultimate-guitar.com", cta:"Find Tabs" },
    { type:"link", title:"YouTube Guitar Lessons", note:"Free video tutorials for every style and level", thumb:"📺", url:"https://www.youtube.com/results?search_query=free+guitar+lessons+beginners", cta:"Watch Lessons" },
  ]},
  "Playing Piano": { icon:"🎹", color:"#7c3aed", desc:"Play and learn piano — even without a real piano", resources:[
    { type:"embed", title:"Virtual Piano Online", note:"Play piano in your browser right now", thumb:"🎹", url:"https://virtualpiano.net", cta:"Play Piano Now" },
    { type:"link", title:"Playground Sessions — Free", note:"Learn piano through songs you love — free trial", thumb:"🎵", url:"https://www.playgroundsessions.com", cta:"Start Free" },
    { type:"link", title:"Synthesia on YouTube", note:"Watch piano pieces with falling notes — beautiful", thumb:"📺", url:"https://www.youtube.com/results?search_query=synthesia+relaxing+piano", cta:"Watch on YouTube" },
    { type:"link", title:"Musictheory.net", note:"Free music theory lessons to understand what you play", thumb:"🎓", url:"https://www.musictheory.net", cta:"Learn Theory Free" },
  ]},
  // ── Screen & Stories ───────────────────────────────────────────────────────
  "Movies & Series": { icon:"🎬", color:"#dc2626", desc:"Feel-good movies and where to watch free", resources:[
    { type:"link", title:"Tubi — Feel Good Movies", note:"Thousands of free movies — no subscription needed", thumb:"📺", url:"https://tubitv.com/category/feel_good", cta:"Watch Free" },
    { type:"link", title:"Pluto TV", note:"Free streaming with feel-good channels always on", thumb:"🌙", url:"https://pluto.tv", cta:"Watch Free" },
    { type:"link", title:"YouTube Free Movies", note:"Google's free ad-supported full movies", thumb:"▶️", url:"https://www.youtube.com/feed/storefront", cta:"Browse Free Movies" },
    { type:"link", title:"Letterboxd — Feel Good List", note:"Community-curated feel-good movie recommendations", thumb:"🎭", url:"https://letterboxd.com/films/popular/genre/comedy/", cta:"Find a Movie" },
  ]},
  "Anime": { icon:"⛩️", color:"#e11d48", desc:"Free anime streaming — slice-of-life and calming", resources:[
    { type:"link", title:"Crunchyroll — Free Tier", note:"Watch anime free with ads — huge library", thumb:"🍥", url:"https://www.crunchyroll.com", cta:"Watch Free Anime" },
    { type:"link", title:"Tubi — Anime Section", note:"Free anime without any subscription", thumb:"📺", url:"https://tubitv.com/category/anime", cta:"Watch on Tubi" },
    { type:"link", title:"MyAnimeList — Slice of Life", note:"Find your next calming anime — community rated", thumb:"📝", url:"https://myanimelist.net/manga/genre/36/Slice_of_Life", cta:"Find Slice-of-Life" },
    { type:"link", title:"YouTube — Free Anime", note:"Official channels with free full episodes", thumb:"▶️", url:"https://www.youtube.com/results?search_query=full+anime+episode+official+free", cta:"Watch on YouTube" },
  ]},
  "Gaming": { icon:"🎮", color:"#7c3aed", desc:"Calming browser games to play right now", resources:[
    { type:"embed", title:"CrazyGames — Relaxing", note:"Collection of calm browser games — no download", thumb:"🎮", url:"https://www.crazygames.com/t/relaxing", cta:"Play Now" },
    { type:"embed", title:"Slither.io", note:"Simple, meditative browser game", thumb:"🐍", url:"https://slither.io", cta:"Play Now" },
    { type:"link", title:"Itch.io Free Chill Games", note:"Free indie calming games playable in browser", thumb:"🕹️", url:"https://itch.io/games/free/tag-relaxing", cta:"Find Free Games" },
    { type:"link", title:"Stardew Valley", note:"Most calming game ever made — farming and peace", thumb:"🌾", url:"https://www.stardewvalley.net", cta:"Learn More" },
  ]},
  "Stand-up Comedy": { icon:"😂", color:"#f59e0b", desc:"Free comedy to instantly lift your mood", resources:[
    { type:"link", title:"Comedy Central (YouTube)", note:"Free stand-up clips from top comedians", thumb:"😂", url:"https://www.youtube.com/@ComedyCentral", cta:"Watch Comedy" },
    { type:"link", title:"Best Stand-Up Compilations", note:"Hours of the best comedy moments on YouTube", thumb:"▶️", url:"https://www.youtube.com/results?search_query=best+standup+comedy+compilation", cta:"Watch Now" },
    { type:"link", title:"ComedyBangBang Podcast", note:"Free improv comedy podcast — hilarious every episode", thumb:"🎙️", url:"https://www.earwolf.com/show/comedy-bang-bang", cta:"Listen Free" },
    { type:"link", title:"Netflix Comedy Specials", note:"Browse stand-up specials on Netflix", thumb:"🎭", url:"https://www.netflix.com/browse/genre/11559", cta:"Browse Specials" },
  ]},
  // ── Mind & Wellness ────────────────────────────────────────────────────────
  "Meditation": { icon:"🧘", color:"#0891b2", desc:"Free guided meditations for stress and anxiety", resources:[
    { type:"link", title:"Insight Timer", note:"World's largest free meditation library — 100,000+ sessions", thumb:"⏱️", url:"https://insighttimer.com", cta:"Meditate Free" },
    { type:"link", title:"UCLA Free Meditations", note:"Guided meditations from UCLA's Mindfulness Center", thumb:"🎓", url:"https://www.uclahealth.org/programs/marc/free-guided-meditations", cta:"Start Session" },
    { type:"link", title:"5-Min Guided Meditation", note:"Quick breathing and body scan — no experience needed", thumb:"📺", url:"https://www.youtube.com/results?search_query=5+minute+guided+meditation+anxiety+relief", cta:"Watch on YouTube" },
    { type:"link", title:"Headspace — Free Basics", note:"Free beginner meditation course", thumb:"🟠", url:"https://www.headspace.com/headspace-meditation-app", cta:"Try Headspace" },
  ]},
  "Yoga": { icon:"🤸", color:"#ea580c", desc:"Free yoga videos for stress and anxiety", resources:[
    { type:"link", title:"Yoga with Adriene", note:"World's most popular free yoga channel", thumb:"📺", url:"https://www.youtube.com/@yogawithadriene", cta:"Watch Free Yoga" },
    { type:"link", title:"Yoga for Anxiety Relief", note:"20-min flow targeting anxiety — beginner friendly", thumb:"💨", url:"https://www.youtube.com/results?search_query=yoga+for+anxiety+relief+beginners+20+minutes", cta:"Find on YouTube" },
    { type:"link", title:"DoYogaWithMe", note:"Free professional yoga videos — all styles and levels", thumb:"🌟", url:"https://www.doyogawithme.com", cta:"Browse Classes" },
    { type:"link", title:"Down Dog App — Free Trial", note:"Personalized yoga sessions — 7-day free trial", thumb:"🐶", url:"https://www.downdogapp.com", cta:"Try Free" },
  ]},
  "Reading Books": { icon:"📚", color:"#2563eb", desc:"Free books and reading resources, right now", resources:[
    { type:"link", title:"Project Gutenberg", note:"70,000+ free classic books", thumb:"📖", url:"https://www.gutenberg.org", cta:"Browse Free Books" },
    { type:"link", title:"Open Library", note:"Borrow digital books for free — millions of titles", thumb:"🏛️", url:"https://openlibrary.org", cta:"Open Library" },
    { type:"link", title:"Standard Ebooks", note:"Beautiful, carefully formatted free ebooks", thumb:"✨", url:"https://standardebooks.org", cta:"Browse Ebooks" },
    { type:"link", title:"ManyBooks", note:"Free ebooks in every genre with community reviews", thumb:"📚", url:"https://manybooks.net", cta:"Find a Book" },
  ]},
  "Philosophy": { icon:"🤔", color:"#6d28d9", desc:"Philosophy for perspective and inner calm", resources:[
    { type:"link", title:"Daily Stoic", note:"Daily Stoic meditations for resilience — free archive", thumb:"⚔️", url:"https://dailystoic.com/stoic-exercises/", cta:"Read Today's Meditation" },
    { type:"link", title:"Philosophy Bites Podcast", note:"Short brilliant philosophy interviews — free", thumb:"🎙️", url:"https://philosophybites.com", cta:"Listen Free" },
    { type:"link", title:"Coursera — Ancient Philosophy", note:"Free course: Ancient philosophy and modern life", thumb:"🎓", url:"https://www.coursera.org/learn/plato", cta:"Enroll Free" },
    { type:"link", title:"Internet Encyclopedia", note:"Read any philosophical concept in depth", thumb:"📖", url:"https://iep.utm.edu", cta:"Explore Philosophy" },
  ]},
  "Stoicism": { icon:"⚔️", color:"#6d28d9", desc:"Stoic philosophy for resilience and calm", resources:[
    { type:"link", title:"Daily Stoic — Exercises", note:"Free daily Stoic meditations and practices", thumb:"⚔️", url:"https://dailystoic.com/stoic-exercises/", cta:"Today's Practice" },
    { type:"link", title:"Meditations by Marcus Aurelius", note:"Read the most famous Stoic text free on Project Gutenberg", thumb:"📖", url:"https://www.gutenberg.org/ebooks/2680", cta:"Read Free" },
    { type:"link", title:"How to Be a Stoic (Podcast)", note:"Practical Stoicism for modern life", thumb:"🎙️", url:"https://howtobeastoic.wordpress.com/podcast/", cta:"Listen Free" },
    { type:"link", title:"Stoic Week — Free Program", note:"Free guided week-long Stoic practice", thumb:"🗓️", url:"https://modernstoicism.com/stoic-week/", cta:"Join Free" },
  ]},
  // ── Physical ───────────────────────────────────────────────────────────────
  "Running & Jogging": { icon:"🏃", color:"#16a34a", desc:"Running plans and motivational resources", resources:[
    { type:"link", title:"NHS Couch to 5K", note:"Free beginner running plan — start from zero", thumb:"👟", url:"https://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/get-running-with-couch-to-5k/", cta:"Start the Plan" },
    { type:"link", title:"Nike Run Club App (Free)", note:"Free guided runs and coaching from Nike", thumb:"✔️", url:"https://www.nike.com/nrc-app", cta:"Download Free" },
    { type:"link", title:"MapMyRun", note:"Free route planning and run tracking", thumb:"🗺️", url:"https://www.mapmyrun.com", cta:"Plan Your Route" },
    { type:"link", title:"Running Motivation Playlists", note:"Tempo-matched music playlists for your run", thumb:"🎵", url:"https://open.spotify.com/search/running%20motivation/playlists", cta:"Find Running Music" },
  ]},
  "Gym & Fitness": { icon:"💪", color:"#dc2626", desc:"Free home workout resources", resources:[
    { type:"link", title:"Nike Training Club", note:"Free world-class workouts — home and gym", thumb:"✔️", url:"https://www.nike.com/ntc-app", cta:"Download Free" },
    { type:"link", title:"FitnessBlender (YouTube)", note:"Thousands of free professional workout videos", thumb:"📺", url:"https://www.youtube.com/@FitnessBlender", cta:"Watch Free Workouts" },
    { type:"link", title:"Darebee Free Plans", note:"Free workout plans with no equipment required", thumb:"📋", url:"https://darebee.com/programs.html", cta:"Get Free Plan" },
    { type:"link", title:"7-Minute Workout", note:"Science-backed quick workout for stress relief", thumb:"⏱️", url:"https://www.youtube.com/results?search_query=7+minute+workout+stress+relief", cta:"Watch on YouTube" },
  ]},
  "Dancing": { icon:"💃", color:"#e11d48", desc:"Free dance tutorials — no experience needed", resources:[
    { type:"link", title:"1MILLION Dance Studio", note:"Viral K-pop and contemporary dance tutorials", thumb:"💃", url:"https://www.youtube.com/@1MILLION", cta:"Watch & Dance" },
    { type:"link", title:"Just Dance Choreography", note:"Official Just Dance videos — follow along free", thumb:"🕺", url:"https://www.youtube.com/results?search_query=just+dance+gameplay+2024", cta:"Dance Now" },
    { type:"link", title:"Dance Church", note:"Free-form movement classes for stress release", thumb:"🙌", url:"https://www.dancechurch.co/online", cta:"Join Class" },
    { type:"link", title:"Steezy Studio", note:"Online dance classes — 7-day free trial", thumb:"⭐", url:"https://www.steezy.co", cta:"Try 7 Days Free" },
  ]},
  // ── Learning ───────────────────────────────────────────────────────────────
  "Learning Languages": { icon:"🌍", color:"#16a34a", desc:"Free language learning — great for focus and calm", resources:[
    { type:"link", title:"Duolingo", note:"World's most popular free language learning app", thumb:"🦉", url:"https://www.duolingo.com", cta:"Start Learning" },
    { type:"link", title:"BBC Languages", note:"Free language resources from BBC — many languages", thumb:"🎓", url:"https://www.bbc.co.uk/languages", cta:"Learn Free" },
    { type:"link", title:"Clozemaster — Free", note:"Learn vocabulary in context — addictive and calming", thumb:"🧩", url:"https://www.clozemaster.com", cta:"Play & Learn" },
    { type:"link", title:"Language Transfer (Free Audio)", note:"Free audio language courses — completely free forever", thumb:"🎧", url:"https://www.languagetransfer.org", cta:"Listen Free" },
  ]},
  "Science & Nature": { icon:"🔬", color:"#0891b2", desc:"Free science content to spark curiosity and wonder", resources:[
    { type:"link", title:"Kurzgesagt (YouTube)", note:"Mind-expanding animated science videos", thumb:"📺", url:"https://www.youtube.com/@kurzgesagt", cta:"Watch Now" },
    { type:"link", title:"BBC Earth (YouTube)", note:"Stunning free nature documentaries", thumb:"🌍", url:"https://www.youtube.com/@BBCEarth", cta:"Watch Nature" },
    { type:"link", title:"NASA Astronomy Photo of the Day", note:"Daily stunning space image with expert explanation", thumb:"🚀", url:"https://apod.nasa.gov/apod/astropix.html", cta:"See Today's Image" },
    { type:"link", title:"Khan Academy — Science", note:"Free science courses on any topic", thumb:"🎓", url:"https://www.khanacademy.org/science", cta:"Learn Free" },
  ]},
  "Astronomy": { icon:"🌌", color:"#4f46e5", desc:"Explore the universe from your screen", resources:[
    { type:"link", title:"NASA Astronomy Photo of the Day", note:"Breathtaking daily space image with explanation", thumb:"🚀", url:"https://apod.nasa.gov/apod/astropix.html", cta:"See Today's Image" },
    { type:"embed", title:"Stellarium Web — Star Map", note:"Interactive real-time star map in your browser", thumb:"⭐", url:"https://stellarium-web.org", cta:"Explore the Sky" },
    { type:"link", title:"NASA Eyes on the Solar System", note:"Free 3D tour of our solar system", thumb:"🌍", url:"https://eyes.nasa.gov/apps/solar-system/", cta:"Explore Free" },
    { type:"link", title:"Hubble Site — Gallery", note:"Stunning free Hubble Space Telescope images", thumb:"🔭", url:"https://hubblesite.org/images/gallery", cta:"Browse Gallery" },
  ]},
  // ── Food & Lifestyle ───────────────────────────────────────────────────────
  "Cooking & Baking": { icon:"🍳", color:"#f97316", desc:"Simple calming recipes to make right now", resources:[
    { type:"link", title:"Budget Bytes", note:"Simple, affordable recipes — perfect for stress cooking", thumb:"🥘", url:"https://www.budgetbytes.com", cta:"Find a Recipe" },
    { type:"link", title:"Tasty — 5-Ingredient Recipes", note:"Easy feel-good recipes anyone can make", thumb:"👨‍🍳", url:"https://tasty.co/tag/5-ingredient", cta:"Get Cooking" },
    { type:"link", title:"Binging with Babish (YouTube)", note:"Comforting, beautiful cooking videos", thumb:"📺", url:"https://www.youtube.com/@bingingwithbabish", cta:"Watch & Cook" },
    { type:"link", title:"Allrecipes — Comfort Food", note:"Community-rated comfort food recipes", thumb:"🍲", url:"https://www.allrecipes.com/recipes/88/everyday-cooking/comfort-food", cta:"Find Comfort Food" },
  ]},
  "Gardening": { icon:"🌱", color:"#16a34a", desc:"Gardening guides and plant care resources", resources:[
    { type:"link", title:"The Sill — Plant Care 101", note:"Free plant care guides and beginner tips", thumb:"🌿", url:"https://www.thesill.com/blogs/plants-101", cta:"Learn Plant Care" },
    { type:"link", title:"Garden Therapy — DIY", note:"Therapeutic gardening projects step-by-step", thumb:"🌺", url:"https://gardentherapy.ca", cta:"Get Ideas" },
    { type:"link", title:"Gardening Know How", note:"Free guides on growing anything, anywhere", thumb:"📖", url:"https://www.gardeningknowhow.com", cta:"Learn to Grow" },
    { type:"link", title:"Apartment Therapy Gardens", note:"Gardening ideas for small spaces and beginners", thumb:"🏠", url:"https://www.apartmenttherapy.com/garden", cta:"Browse Ideas" },
  ]},
  // ── Social & Community ─────────────────────────────────────────────────────
  "Pets & Animals": { icon:"🐾", color:"#f59e0b", desc:"Animal content to instantly boost your mood", resources:[
    { type:"link", title:"r/aww on Reddit", note:"Endless cute animal photos and videos", thumb:"🐶", url:"https://www.reddit.com/r/aww", cta:"Browse Cuteness" },
    { type:"link", title:"The Dodo", note:"Heartwarming animal rescue and friendship stories", thumb:"💛", url:"https://www.thedodo.com", cta:"Watch Stories" },
    { type:"link", title:"Explore.org Live Cams", note:"Live wildlife cameras — bears, kittens, puppies, eagles", thumb:"🎥", url:"https://explore.org/livecams", cta:"Watch Live Animals" },
    { type:"link", title:"Petfinder", note:"Browse adorable adoptable pets near you", thumb:"🏠", url:"https://www.petfinder.com", cta:"Meet Animals" },
  ]},
  "Board Games": { icon:"🎲", color:"#f59e0b", desc:"Play board games online — free and solo", resources:[
    { type:"link", title:"Board Game Arena", note:"Play 800+ board games free online with others", thumb:"🎲", url:"https://boardgamearena.com", cta:"Play Free" },
    { type:"link", title:"Tabletopia", note:"Digital board game platform — huge free library", thumb:"🃏", url:"https://tabletopia.com", cta:"Browse Games" },
    { type:"link", title:"Yucata", note:"Free online board games — no download needed", thumb:"🎯", url:"https://www.yucata.de/en", cta:"Play Now" },
    { type:"link", title:"BoardGameGeek", note:"Find your next favourite board game to try", thumb:"📖", url:"https://boardgamegeek.com/browse/boardgame", cta:"Discover Games" },
  ]},
};

const ASSESSMENT_QUESTIONS = [
  { q:"How would you describe your energy levels today?", opts:["Very low / exhausted","Lower than usual","About normal","Good / energized"] },
  { q:"How connected do you feel to people around you?", opts:["Very isolated","Somewhat lonely","Neutral","Connected & supported"] },
  { q:"How are you sleeping lately?", opts:["Very poorly / too much","Disrupted sleep","Okay","Sleeping well"] },
  { q:"How often are you finding enjoyment in things you normally like?", opts:["Rarely or never","Occasionally","Sometimes","Often / as usual"] },
  { q:"How would you rate your overall mood this week?", opts:["Very low","Struggling","Mixed","Generally okay"] },
  { q:"How well are you able to focus and concentrate?", opts:["Very difficult","Somewhat hard","Okay","Clear-headed"] },
  { q:"How are you feeling about the future?", opts:["Hopeless","Uncertain / worried","Unsure","Hopeful / positive"] },
  { q:"How often have you felt overwhelmed or anxious?", opts:["Nearly all the time","Often","Sometimes","Rarely"] },
  { q:"How well are you caring for yourself (eating, hygiene, basics)?", opts:["Not at all","Struggling","Somewhat","Taking good care of myself"] },
];

const MOCK_TREND = [
  {date:"Feb 4",mood:58,risk:30},{date:"Feb 8",mood:52,risk:38},{date:"Feb 12",mood:68,risk:24},
  {date:"Feb 16",mood:45,risk:52},{date:"Feb 20",mood:60,risk:40},{date:"Feb 24",mood:66,risk:29},{date:"Feb 28",mood:74,risk:18},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

async function callAI(messages,risk,interests){
  try {
    const d=await apiFetch("/ai/chat",{method:"POST",body:{messages:messages.map(m=>({role:m.role,content:m.content})),risk,interests}});
    return d.reply||"I hear you. Would you like to share more?";
  } catch{return "I'm having a connection issue right now, but your feelings matter. Take a slow breath 💙";}
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
    style:{width:"100%",padding:"11px 15px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(139,92,246,0.22)",borderRadius:"9px",color:"white",fontSize:"14px",outline:"none",boxSizing:"border-box"}});
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 30% 20%, #1a0a2e 0%, #0a0a14 50%, #091220 100%)"}}>
      <div style={{background:"rgba(255,255,255,0.025)",backdropFilter:"blur(24px)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:"22px",padding:"44px",width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"44px",marginBottom:"10px"}}>🧠</div>
          <h1 style={{color:"white",fontSize:"26px",fontWeight:"900"}}>Deprex</h1>
          <p style={{color:"rgba(255,255,255,0.38)",fontSize:"13px",marginTop:"3px"}}>Mental Health Risk Monitoring & Support</p>
        </div>
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:"10px",padding:"3px",marginBottom:"22px"}}>
          {[["login","Sign In"],["register","Register"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:"600",background:mode===m?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",color:mode===m?"white":"rgba(255,255,255,0.42)"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          {mode==="register"&&<div><label style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",display:"block",marginBottom:"5px"}}>Full Name</label><input {...inp("name")} placeholder="Your name"/></div>}
          <div><label style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",display:"block",marginBottom:"5px"}}>Email</label><input {...inp("email","email")} placeholder="you@example.com"/></div>
          <div><label style={{color:"rgba(255,255,255,0.55)",fontSize:"12px",display:"block",marginBottom:"5px"}}>Password</label><input {...inp("password","password")} placeholder="••••••••"/></div>
        </div>
        {err&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",padding:"9px 13px",color:"#f87171",fontSize:"13px",marginTop:"14px"}}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"11px",color:"white",fontSize:"15px",fontWeight:"700",cursor:"pointer",marginTop:"20px",opacity:busy?0.7:1}}>
          {busy?"Please wait...":mode==="login"?"Sign In":"Create Account"}
        </button>
        <p style={{textAlign:"center",color:"rgba(255,255,255,0.25)",fontSize:"11px",marginTop:"18px",lineHeight:"1.5"}}>⚕️ Deprex does not diagnose depression. It provides early risk indicators and support guidance only.</p>
      </div>
    </div>
  );
}

// Friendly placeholder hints for the free-text preference fields
function getPlaceholderHint(interest) {
  const hints = {
    "Chess": "I love solving tactical puzzles and endgame studies, not so much openings",
    "Sudoku": "I prefer hard difficulty classic 9x9 puzzles, timed ones are fun too",
    "Crosswords": "I enjoy the NYT mini crossword, themed puzzles are my favourite",
    "Word Games": "I love Wordle and word connection games, anything vocabulary-based",
    "Jigsaw Puzzles": "I like nature and landscape scenes, 500–1000 piece puzzles",
    "Logic Puzzles": "Grid-based deduction puzzles and nonograms are my go-to",
    "Gaming": "I enjoy calm exploration and puzzle games, nothing too fast-paced",
    "Meditation": "I prefer guided voice meditations, short 5–10 minute sessions",
    "Yoga": "Gentle restorative yoga, especially for anxiety and evening wind-down",
    "Listening to Music": "Lo-fi and ambient music, no lyrics, something I can focus to",
    "Lo-fi & Ambient": "Rain sounds and forest ambience mixed with soft lo-fi beats",
    "Reading Books": "I love classic fiction and short stories, nothing too heavy",
    "Movies & Series": "Feel-good comedies and heartwarming films, nothing stressful",
    "Drawing & Sketching": "I enjoy zentangle and mindful doodling, no pressure to be perfect",
    "Writing & Poetry": "Free journaling and creative writing prompts help me unwind",
    "Cooking & Baking": "I love baking desserts and trying simple comfort food recipes",
    "Running & Jogging": "Slow easy runs outdoors, I follow a beginner 5K plan",
    "Gym & Fitness": "Home workouts with no equipment, stretching and mobility focus",
    "Learning Languages": "I'm learning Spanish through stories and vocabulary games",
    "Anime": "Slice-of-life and Studio Ghibli style anime, calming and slow-paced",
    "Podcasts": "Mental health and science podcasts, 20–40 minute episodes",
    "Photography": "I love nature and landscape photography, golden hour shots",
  };
  return hints[interest] || `describe what you specifically enjoy about ${interest}`;
}


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


function OnboardingChat({ user, onComplete }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello ${user.name || "there"}! I'm your Deprex companion. I'd love to help personalize your experience. To start, could you tell me a little bit about what you enjoy doing in your free time, or what helps you unwind?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [detectedInterests, setDetectedInterests] = useState([]);
  const [detectedSubs, setDetectedSubs] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch("/ai/onboard/chat", {
        method: "POST",
        body: { messages: newMsgs }
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.complete) {
        setComplete(true);
        setDetectedInterests(data.interests || []);
        setDetectedSubs(data.sub_interests || {});
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting to my cognitive core right now. Could you please try typing that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete(detectedInterests, detectedSubs);
  };

  return (
    <div style={{
      maxWidth: "650px",
      margin: "40px auto",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(20px)",
      borderRadius: "20px",
      height: "calc(100vh - 120px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
    }}>
      {/* Chat Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)"
      }}>
        <div style={{ fontSize: "28px" }}>🧠</div>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc", margin: 0 }}>Onboarding Companion</h2>
          <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", margin: "2px 0 0 0" }}>Warm AI-driven interest personalization</p>
        </div>
      </div>

      {/* Messages Body */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              maxWidth: "80%",
              padding: "12px 18px",
              borderRadius: msg.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
              background: msg.role === "user" 
                ? "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)" 
                : "rgba(255, 255, 255, 0.05)",
              border: msg.role === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              color: "#f8fafc",
              fontSize: "14px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContext: "flex-start" }}>
            <div style={{
              padding: "12px 18px",
              borderRadius: "18px 18px 18px 2px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "13px"
            }}>
              Companion is thinking...
            </div>
          </div>
        )}

        {complete && (
          <div style={{
            background: "rgba(16, 185, 129, 0.06)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "12px",
            color: "#f8fafc"
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#34d399", margin: "0 0 12px 0" }}>✔ Personalization Complete!</h3>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 16px 0" }}>
              We've identified the following interests and tailored relief paths for you:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {detectedInterests.map((interest, idx) => (
                <div key={idx} style={{
                  padding: "6px 12px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  ✨ {interest}
                </div>
              ))}
            </div>
            <button 
              onClick={handleFinish}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
              }}
            >
              Enter My Relief Dashboard
            </button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Form */}
      {!complete && (
        <form onSubmit={handleSend} style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(0,0,0,0.2)",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your response here..."
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "12px 16px",
              color: "white",
              fontSize: "14px",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              cursor: (loading || !input.trim()) ? "default" : "pointer",
              opacity: (loading || !input.trim()) ? 0.5 : 1
            }}
          >
            Send
          </button>
        </form>
      )}
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
function Sidebar({tab,setTab,user,logout,risk,onGoHome}){
  const ri=riskInfo(risk);
  const navs=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"journal",icon:"📝",label:"Daily Journal"},{id:"assess",icon:"🌡️",label:"Mood Assessment"},{id:"relief",icon:"🌿",label:"Stress Relief"},{id:"chat",icon:"💬",label:"AI Support Chat"}];
  return(
    <div style={{width:"248px",minHeight:"100vh",background:"rgba(0,0,0,0.28)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"20px 13px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"24px",padding:"0 7px"}}>
        <div style={{width:"36px",height:"36px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>🧠</div>
        <div><div style={{color:"white",fontWeight:"800",fontSize:"17px"}}>Deprex</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:"10px"}}>Mental Health Monitor</div></div>
      </div>
      <div style={{background:ri.bg,border:`1px solid ${ri.border}`,borderRadius:"11px",padding:"11px",marginBottom:"18px"}}>
        <div style={{color:"rgba(255,255,255,0.38)",fontSize:"10px",marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Risk Level</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:ri.color,fontWeight:"700",fontSize:"13px"}}>{ri.label}</span>
          <span style={{color:ri.color,fontSize:"12px",fontWeight:"600"}}>{(risk*100).toFixed(0)}%</span>
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"3px",height:"3px",marginTop:"6px"}}>
          <div style={{width:`${risk*100}%`,height:"100%",borderRadius:"3px",background:ri.color,transition:"width 0.6s"}}/>
        </div>
      </div>
      {user.interests?.length>0&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"9px",padding:"9px 10px",marginBottom:"4px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
            <div style={{color:"rgba(255,255,255,0.32)",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.4px"}}>My Interests</div>
            <button onClick={()=>setTab("editInterests")} style={{background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.35)",borderRadius:"6px",padding:"2px 7px",color:"#c4b5fd",fontSize:"10px",cursor:"pointer",fontWeight:"600"}}>✏️ Edit</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
            {user.interests.slice(0,6).map(i=>{
              const d=INTEREST_RESOURCES[i];
              return <span key={i} style={{background:d?`${d.color}18`:"rgba(124,58,237,0.16)",borderRadius:"20px",padding:"2px 7px",color:d?d.color:"#c4b5fd",fontSize:"10px",display:"flex",alignItems:"center",gap:"3px"}}>{d?.icon} {i}</span>;
            })}
            {user.interests.length>6&&<button onClick={()=>setTab("editInterests")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.28)",fontSize:"10px",cursor:"pointer",padding:"2px 5px"}}>+{user.interests.length-6} more…</button>}
          </div>
        </div>
      )}
      {(!user.interests||user.interests.length===0)&&(
        <button onClick={()=>setTab("editInterests")} style={{display:"flex",alignItems:"center",gap:"7px",width:"100%",padding:"9px 12px",background:"rgba(124,58,237,0.1)",border:"1px dashed rgba(124,58,237,0.35)",borderRadius:"9px",color:"#c4b5fd",fontSize:"12px",cursor:"pointer",marginBottom:"4px"}}>
          ✨ Set your interests
        </button>
      )}
      <nav style={{flex:1,marginTop:"12px"}}>
        <button onClick={onGoHome} style={{width:"100%",display:"flex",alignItems:"center",gap:"9px",padding:"10px 12px",borderRadius:"9px",border:"1px solid transparent",cursor:"pointer",marginBottom:"3px",background:"transparent",color:"rgba(255,255,255,0.4)",fontWeight:"400",fontSize:"13px",textAlign:"left",transition:"all 0.15s"}}>
          <span style={{fontSize:"15px"}}>🏠</span>Home Landing Page
        </button>
        {navs.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"9px",padding:"10px 12px",borderRadius:"9px",border:tab===n.id?"1px solid rgba(124,58,237,0.32)":"1px solid transparent",cursor:"pointer",marginBottom:"3px",background:tab===n.id?"rgba(124,58,237,0.15)":"transparent",color:tab===n.id?"white":"rgba(255,255,255,0.4)",fontWeight:tab===n.id?"600":"400",fontSize:"13px",textAlign:"left",transition:"all 0.15s"}}>
            <span style={{fontSize:"15px"}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 10px",marginBottom:"7px"}}>
          <div style={{width:"28px",height:"28px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"700",fontSize:"12px",flexShrink:0}}>{user.name[0].toUpperCase()}</div>
          <div style={{overflow:"hidden"}}><div style={{color:"white",fontSize:"12px",fontWeight:"600",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:"10px"}}>{user.email}</div></div>
        </div>
        <button onClick={logout} style={{width:"100%",padding:"8px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:"7px",color:"#f87171",fontSize:"12px",cursor:"pointer"}}>Sign Out</button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({user,risk,journals,assessHistory,reliefEvents,chatEvents,setTab}){
  const ri=riskInfo(risk); const latest=assessHistory[assessHistory.length-1]; const sev=latest?severityLabel(latest.score):null;
  const avgMood=journals.length?Math.round(journals.reduce((a,j)=>a+j.sentiment.score*100,0)/journals.length):null;
  const activityImpact=computeActivityImpact(reliefEvents||[]);

  // Compute per-day chat impact
  const chatImpactByDay={};
  (chatEvents||[]).forEach(ev=>{
    const key=new Date(ev.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});
    if(!chatImpactByDay[key]) chatImpactByDay[key]={moodDelta:0,riskDelta:0,count:0,hasCrisis:false};
    chatImpactByDay[key].moodDelta+=ev.moodDelta||0;
    chatImpactByDay[key].riskDelta+=ev.riskDelta||0;
    chatImpactByDay[key].count++;
    if(ev.level==="crisis") chatImpactByDay[key].hasCrisis=true;
  });

  // Build chart: start with mock baseline, overlay real journal + activity + chat data
  const baseChart=[...MOCK_TREND];
  const allDates=new Set(baseChart.map(d=>d.date));

  journals.slice(-5).forEach(j=>{
    const dateKey=new Date(j.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});
    const baseMood=Math.round(j.sentiment.score*100);
    const aImpact=activityImpact[dateKey]||{moodBoost:0,riskReduction:0};
    const cImpact=chatImpactByDay[dateKey]||{moodDelta:0,riskDelta:0};
    const finalMood=Math.min(100,Math.max(0, baseMood + aImpact.moodBoost + cImpact.moodDelta));
    const finalRisk=Math.min(97,Math.max(2, Math.round(risk*100) - Math.round(aImpact.riskReduction*100) + Math.round(cImpact.riskDelta*100)));
    if(!allDates.has(dateKey)){baseChart.push({date:dateKey,mood:finalMood,risk:finalRisk});}
    else{const idx=baseChart.findIndex(d=>d.date===dateKey);if(idx>=0)baseChart[idx]={...baseChart[idx],mood:finalMood,risk:finalRisk};}
    allDates.add(dateKey);
  });

  // Overlay activity-only days
  Object.entries(activityImpact).forEach(([dateKey,impact])=>{
    if(!allDates.has(dateKey)){
      const cImpact=chatImpactByDay[dateKey]||{moodDelta:0,riskDelta:0};
      baseChart.push({date:dateKey,mood:Math.min(100,55+impact.moodBoost+cImpact.moodDelta),risk:Math.max(2,Math.round(risk*100)-Math.round(impact.riskReduction*100)+Math.round(cImpact.riskDelta*100))});
      allDates.add(dateKey);
    }
  });

  // Overlay chat-only days
  Object.entries(chatImpactByDay).forEach(([dateKey,impact])=>{
    if(!allDates.has(dateKey)){
      baseChart.push({date:dateKey,mood:Math.min(100,Math.max(0,55+impact.moodDelta)),risk:Math.min(97,Math.max(2,Math.round(risk*100)+Math.round(impact.riskDelta*100)))});
      allDates.add(dateKey);
    }
  });

  const chartData=baseChart.slice(-10);
  const totalActivities=(reliefEvents||[]).length;
  const crisisCount=(chatEvents||[]).filter(e=>e.level==="crisis").length;
  const matchedInterests=user.interests?.filter(i=>INTEREST_RESOURCES[i])||[];
  return(
    <div style={{padding:"26px 30px",overflowY:"auto",height:"100vh"}}>
      <div style={{marginBottom:"18px"}}><h1 style={{color:"white",fontSize:"22px",fontWeight:"800"}}>Welcome back, {user.name} 👋</h1><p style={{color:"rgba(255,255,255,0.3)",marginTop:"3px",fontSize:"12px"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
      <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:"10px",padding:"9px 13px",marginBottom:"18px",fontSize:"11px",color:"rgba(255,255,255,0.42)",lineHeight:"1.5"}}>
        ⚕️ <strong style={{color:"rgba(255,255,255,0.7)"}}>Disclaimer:</strong> Deprex provides early risk <em>indicators</em> and support guidance only. It does <strong style={{color:"rgba(255,255,255,0.7)"}}>not diagnose</strong> any condition. Consult a qualified professional for diagnosis and treatment.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"18px"}}>
        {[{label:"Risk Score",val:`${(risk*100).toFixed(0)}%`,sub:ri.label,icon:"⚡",c:ri.color},{label:"Journals",val:journals.length,sub:"Entries logged",icon:"📝",c:"#7c3aed"},{label:"Assessment",val:latest?`${latest.score}/${ASSESSMENT_QUESTIONS.length*3}`:"—",sub:sev?.label??"Not taken",icon:"🌡️",c:sev?.color??"#555"},{label:"Activities Done",val:totalActivities,sub:"Relief activities",icon:"🌿",c:"#16a34a"}].map(s=>(
          <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{color:"rgba(255,255,255,0.36)",fontSize:"10px",marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.4px"}}>{s.label}</div><div style={{color:s.c,fontSize:"22px",fontWeight:"800"}}>{s.val}</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:"10px",marginTop:"2px"}}>{s.sub}</div></div>
              <span style={{fontSize:"18px",opacity:0.8}}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"16px"}}>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <h3 style={{color:"white",fontWeight:"700",fontSize:"13px"}}>📈 Mood Progression</h3>
            {totalActivities>0&&<span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:"20px",padding:"2px 8px",color:"#4ade80",fontSize:"10px",fontWeight:"600"}}>{totalActivities} activities completed</span>}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData}><defs><linearGradient id="mG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="date" tick={{fill:"rgba(255,255,255,0.3)",fontSize:10}}/><YAxis tick={{fill:"rgba(255,255,255,0.3)",fontSize:10}} domain={[0,100]}/>
              <Tooltip contentStyle={{background:"#1a1030",border:"1px solid rgba(124,58,237,0.4)",borderRadius:"8px",color:"white",fontSize:"11px"}}/>
              <Area type="monotone" dataKey="mood" stroke="#7c3aed" fill="url(#mG)" strokeWidth={2} dot={{fill:"#7c3aed",r:2}} name="Mood %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <h3 style={{color:"white",fontWeight:"700",fontSize:"13px"}}>⚡ Risk Score Trend</h3>
            {totalActivities>0&&<span style={{background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"20px",padding:"2px 8px",color:"#c4b5fd",fontSize:"10px",fontWeight:"600"}}>Updating with your activity</span>}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/><XAxis dataKey="date" tick={{fill:"rgba(255,255,255,0.3)",fontSize:10}}/><YAxis tick={{fill:"rgba(255,255,255,0.3)",fontSize:10}} domain={[0,100]}/>
              <Tooltip contentStyle={{background:"#1a1030",border:"1px solid rgba(239,68,68,0.4)",borderRadius:"8px",color:"white",fontSize:"11px"}} formatter={v=>[v+"%","Risk"]}/>
              <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={{fill:"#ef4444",r:2}} name="Risk %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {matchedInterests.length>0&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"13px",padding:"18px",marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <h3 style={{color:"white",fontWeight:"700",fontSize:"13px"}}>🌿 Your Stress Relief Resources</h3>
            <button onClick={()=>setTab("relief")} style={{background:"rgba(124,58,237,0.16)",border:"1px solid rgba(124,58,237,0.28)",borderRadius:"20px",padding:"4px 10px",color:"#c4b5fd",fontSize:"11px",cursor:"pointer"}}>See all →</button>
          </div>
          <div style={{display:"flex",gap:"9px",overflowX:"auto",paddingBottom:"4px"}}>
            {matchedInterests.slice(0,5).map(interest=>{
              const d=INTEREST_RESOURCES[interest]; const res=d.resources[0];
              return(
                <div key={interest} style={{background:`${d.color}12`,border:`1px solid ${d.color}22`,borderRadius:"10px",padding:"12px",minWidth:"180px",flexShrink:0}}>
                  <div style={{fontSize:"18px",marginBottom:"5px"}}>{d.icon}</div>
                  <div style={{color:"white",fontWeight:"700",fontSize:"12px",marginBottom:"3px"}}>{interest}</div>
                  <div style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",marginBottom:"9px"}}>{d.resources.length} resources available</div>
                  <button onClick={()=>setTab("relief")} style={{padding:"5px 10px",background:`${d.color}28`,border:`1px solid ${d.color}44`,borderRadius:"7px",color:d.color,fontSize:"11px",fontWeight:"700",cursor:"pointer",width:"100%"}}>Access Resources →</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(risk>0.5||crisisCount>0)&&(
        <div style={{background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.22)",borderRadius:"13px",padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><span>💙</span><strong style={{color:"#c4b5fd",fontSize:"13px"}}>We're here for you</strong></div>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",marginBottom:"10px"}}>It looks like you may be going through a tough time. You don't have to face this alone — real support is just a call away.</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <a href="tel:988" style={{padding:"6px 12px",background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:"7px",color:"#c4b5fd",textDecoration:"none",fontSize:"12px",fontWeight:"600"}}>📞 Talk to someone — 988</a>
            <a href="https://988lifeline.org/chat" target="_blank" rel="noopener noreferrer" style={{padding:"6px 12px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"7px",color:"#c4b5fd",textDecoration:"none",fontSize:"12px"}}>💬 Chat online</a>
          </div>
        </div>
      )}
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

// Which INTEREST_CATEGORIES category does an interest belong to?
function getCategoryFor(interest) {
  for(const cat of INTEREST_CATEGORIES){
    if(cat.items.includes(interest)) return cat.category;
  }
  return "Other";
}

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

  const interests=user.interests||[];
  const matched=interests.filter(i=>INTEREST_RESOURCES[i]);
  const custom=interests.filter(i=>!INTEREST_RESOURCES[i]);
  const [customGuides, setCustomGuides] = useState({});
  const [loadingGuides, setLoadingGuides] = useState({});
  const [aiResources, setAiResources] = useState({});
  const [loadingRefresh, setLoadingRefresh] = useState({});

  const FALLBACK_RESOURCES = [
    { type: "embed", title: "Box Breathing Exercise", note: "Follow the visual pace to regulate your heart rate.", thumb: "🌬️", url: "https://www.youtube.com/embed/n6RbW2BAMBY", cta: "Start Breathing" },
    { type: "link", title: "Nature Soundscapes", note: "Listen to soothing ambient nature sounds for deep grounding.", thumb: "🌊", url: "https://mynoise.net/NoiseMachines/rainNoiseGenerator.php", cta: "Listen Now" }
  ];

  // Fetch custom AI guides & AI resources for custom interests (e.g. Carrom, Drawing)
  useEffect(() => {
    custom.forEach(interest => {
      if (!customGuides[interest] && !loadingGuides[interest]) {
        setLoadingGuides(prev => ({ ...prev, [interest]: true }));
        apiFetch("/ai/custom-guide", {
          method: "POST",
          body: { interest, description: subInterests[interest] || "" }
        }).then(data => {
          setCustomGuides(prev => ({ ...prev, [interest]: data.guide }));
        }).catch(() => {
          setCustomGuides(prev => ({ 
            ...prev, 
            [interest]: "• Engage in this activity with full presence.\n• Focus on the sensory feedback and the rhythm of the tasks.\n• Allow your thoughts to settle without judgment." 
          }));
        }).finally(() => {
          setLoadingGuides(prev => ({ ...prev, [interest]: false }));
        });
      }

      if (!aiResources[interest] && !loadingRefresh[interest]) {
        setLoadingRefresh(prev => ({ ...prev, [interest]: true }));
        apiFetch("/ai/generate-resources", {
          method: "POST",
          body: { interest, description: subInterests[interest] || "" }
        }).then(data => {
          if (data.resources && data.resources.length) {
            setAiResources(prev => ({ ...prev, [interest]: data.resources }));
          }
        }).catch(() => {}).finally(() => {
          setLoadingRefresh(prev => ({ ...prev, [interest]: false }));
        });
      }
    });
  }, [custom.join(","), subInterests]);

  const handleRefreshSection = async (catInterests, sectionId) => {
    const key = sectionId || catInterests.join("+");
    setLoadingRefresh(prev => ({ ...prev, [key]: true }));
    try {
      for (const interest of catInterests) {
        const currentRes = getResourcesForInterest(interest);
        const excludeTitles = currentRes.map(r => r.title);
        const data = await apiFetch("/ai/generate-resources", {
          method: "POST",
          body: {
            interest,
            description: subInterests[interest] || "",
            exclude_titles: excludeTitles
          }
        });
        if (data.resources && data.resources.length) {
          setAiResources(prev => ({ ...prev, [interest]: data.resources }));
        }
      }
    } catch (e) {
      console.error("Refresh AI resources error", e);
    } finally {
      setLoadingRefresh(prev => ({ ...prev, [key]: false }));
    }
  };

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
    if (aiResources[interest] && aiResources[interest].length) {
      return aiResources[interest];
    }
    const desc=subInterests[interest];
    const data=INTEREST_RESOURCES[interest];
    if(data) {
      if(desc&&desc.trim()){
        const cacheKey=`${interest}::${desc}`;
        if(personalisedResources[cacheKey]) return personalisedResources[cacheKey];
      }
      return data.resources;
    }
    return FALLBACK_RESOURCES;
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
          <div style={{width:"36px",height:"36px",background:isDone?"rgba(34,197,94,0.18)":`${cardColor}20`,borderRadius:"9px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>{res.thumb||"🎯"}</div>
          <div style={{flex:1,minWidth:0,paddingRight:"22px"}}>
            <div style={{color:isDone?"rgba(255,255,255,0.45)":"white",fontWeight:"700",fontSize:"12px",textDecoration:isDone?"line-through":"none",marginBottom:"2px"}}>{res.title}</div>
            <div style={{color:"rgba(255,255,255,0.42)",fontSize:"11px",lineHeight:"1.35"}}>{res.note}</div>
            {doneCount>0&&<div style={{color:"#4ade80",fontSize:"10px",marginTop:"3px",fontWeight:"600"}}>✓ Completed {doneCount}×</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:"5px"}}>
          {res.type==="embed"&&(
            <button onClick={()=>setOpenResource({url:res.url,title:res.title})} style={{flex:1,padding:"6px 9px",background:`${cardColor}28`,border:`1px solid ${cardColor}50`,borderRadius:"7px",color:cardColor,cursor:"pointer",fontSize:"11px",fontWeight:"700"}}>▶ {res.cta||"Open"}</button>
          )}
          <a href={res.url} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"6px 9px",background:res.type==="embed"?"rgba(255,255,255,0.05)":`${cardColor}28`,border:`1px solid ${res.type==="embed"?"rgba(255,255,255,0.09)":cardColor+"50"}`,borderRadius:"7px",color:res.type==="embed"?"rgba(255,255,255,0.4)":cardColor,textDecoration:"none",fontSize:"11px",fontWeight:"700",textAlign:"center",display:"block"}}>
            {res.type==="embed"?"↗ Open Tab":`↗ ${res.cta||"Open"}`}
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

      {matched.length===0&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"32px",textAlign:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>🎯</div>
          <h3 style={{color:"white",fontWeight:"700",fontSize:"15px",marginBottom:"8px"}}>Let's personalise your resources</h3>
          <p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px",marginBottom:"16px"}}>Tell us what you enjoy — chess, jazz, yoga, cooking — and we'll bring those exact resources here.</p>
          <button onClick={onEditInterests} style={{padding:"10px 24px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:"10px",color:"white",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}>✨ Choose My Interests</button>
        </div>
      )}

      {sections.map(({sectionId,cat,catInterests,leadData,allResources})=>{
        const isRefreshingSection = loadingRefresh[sectionId];
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
                      {d?.icon||"✨"} {i}
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
                <button 
                  onClick={()=>handleRefreshSection(catInterests, sectionId)} 
                  disabled={isRefreshingSection}
                  style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",background:isRefreshingSection?`${accentColor}20`:"rgba(255,255,255,0.05)",border:`1px solid ${isRefreshingSection?accentColor+"50":"rgba(255,255,255,0.1)"}`,borderRadius:"8px",color:isRefreshingSection?accentColor:"rgba(255,255,255,0.45)",cursor:isRefreshingSection?"wait":"pointer",fontSize:"11px",fontWeight:"600"}}
                >
                  {isRefreshingSection ? "🔄 Fetching AI Resources..." : "🔄 Refresh"}
                </button>
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

      {custom.map(interest => {
        const sectionId = `custom-${interest}`;
        const guide = customGuides[interest];
        const isLoadingGuide = loadingGuides[interest];
        const isLoadingRes = loadingRefresh[interest] || loadingRefresh[sectionId];
        const accentColor = "#0d9488"; // nice teal for custom AI recommendations
        const resources = getResourcesForInterest(interest);
        
        return (
          <div key={sectionId} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${accentColor}22`,borderRadius:"16px",padding:"18px",marginBottom:"18px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:"4px",background:`${accentColor}1a`,border:`1px solid ${accentColor}40`,borderRadius:"20px",padding:"3px 10px",color:accentColor,fontSize:"12px",fontWeight:"700"}}>
                  ✨ {interest}
                </span>
              </div>
              <button 
                onClick={() => handleRefreshSection([interest], sectionId)} 
                disabled={isLoadingRes}
                style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",background:isLoadingRes ? `${accentColor}25` : "rgba(255,255,255,0.05)",border:`1px solid ${isLoadingRes ? accentColor + "60" : "rgba(255,255,255,0.1)"}`,borderRadius:"8px",color:isLoadingRes ? accentColor : "rgba(255,255,255,0.45)",cursor:isLoadingRes ? "wait" : "pointer",fontSize:"11px",fontWeight:"600"}}
              >
                {isLoadingRes ? "🔄 Fetching AI Resources..." : "🔄 Refresh"}
              </button>
            </div>

            <p style={{color:"rgba(255,255,255,0.28)",fontSize:"11px",marginBottom:"13px"}}>
              Custom AI-personalized stress-relief path for {interest}
            </p>

            {/* AI Guide Card */}
            <div style={{
              background: "rgba(13, 148, 136, 0.04)",
              border: "1px solid rgba(13, 148, 136, 0.15)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "14px",
              color: "#f8fafc"
            }}>
              <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#2dd4bf", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🧠</span> AI Mindfulness Guide
              </h4>
              {isLoadingGuide ? (
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Generating your guide...</div>
              ) : (
                <div style={{ 
                  fontSize: "12px", 
                  color: "rgba(255,255,255,0.75)", 
                  lineHeight: "1.6",
                  whiteSpace: "pre-line"
                }}>
                  {guide}
                </div>
              )}
            </div>

            {/* AI Generated Resources Grid */}
            {isLoadingRes && (!resources || !resources.length) ? (
              <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                ✨ Asking AI to discover custom online resources for {interest}...
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px"}}>
                {resources.map(res => (
                  <ResourceCard key={res.title} res={res} sectionId={sectionId} color={accentColor}/>
                ))}
              </div>
            )}
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

// ─── AUTH MODAL ─────────────────────────────────────────────────────────────
function AuthModal({ isOpen, onClose, initialMode = "login", onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoSimOpen, setDemoSimOpen] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId && !clientId.includes("your_google_client_id")) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
        });
      } catch (e) {
        console.error("GSI init error", e);
      }
    }
  }, [isOpen]);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/google", {
        method: "POST",
        body: { credential: response.credential },
      });
      localStorage.setItem("dx_token", data.access_token);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && !clientId.includes("your_google_client_id")) {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "email profile openid",
            callback: async (tokenResponse) => {
              if (tokenResponse.access_token) {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const info = await res.json();
                  if (info.email) {
                    const data = await apiFetch("/auth/google", {
                      method: "POST",
                      body: { credential: "google_oauth_popup", email: info.email, name: info.name || info.given_name },
                    });
                    localStorage.setItem("dx_token", data.access_token);
                    onAuthSuccess(data.user);
                    onClose();
                  } else {
                    setError("Could not retrieve profile from Google");
                  }
                } catch (err) {
                  setError(err.message || "Google authentication failed");
                } finally {
                  setLoading(false);
                }
              }
            },
          });
          client.requestAccessToken();
          return;
        } catch (e) {
          console.error("GSI token client error", e);
        }
      }
      const redirectUri = window.location.origin.replace(/\/$/, "");
      const scope = "email profile openid";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
      window.location.href = authUrl;
    } else {
      setDemoSimOpen(true);
    }
  };

  const handleDemoGoogleSignIn = async (simEmail, simName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/google", {
        method: "POST",
        body: {
          credential: "demo_google_credential",
          email: simEmail || "alex.demo@gmail.com",
          name: simName || "Alex Morgan",
        },
      });
      localStorage.setItem("dx_token", data.access_token);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/auth/register" : "/auth/login";
      const payload = mode === "signup" ? { name, email, password } : { email, password };
      const data = await apiFetch(endpoint, { method: "POST", body: payload });
      localStorage.setItem("dx_token", data.access_token);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(5, 7, 18, 0.85)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        background: "linear-gradient(145deg, rgba(24, 16, 48, 0.96), rgba(10, 12, 26, 0.96))",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.25)",
        borderRadius: "24px", padding: "32px 28px", color: "white", position: "relative",
        animation: "modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: "absolute", top: "18px", right: "18px",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%", width: "32px", height: "32px", color: "rgba(255,255,255,0.6)",
          cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div style={{ fontSize: "36px", marginBottom: "6px" }}>🧠</div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 6px", fontFamily: "'Outfit', sans-serif" }}>
            {mode === "signup" ? "Create your Deprex Account" : "Welcome back to Deprex"}
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            {mode === "signup" ? "Start your personalized AI mental wellness journey" : "Sign in to access your AI companion & mood tracker"}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "12px", marginBottom: "20px" }}>
          <button onClick={() => setMode("login")} style={{
            flex: 1, padding: "9px", border: "none", borderRadius: "9px",
            background: mode === "login" ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "transparent",
            color: mode === "login" ? "white" : "rgba(255,255,255,0.6)",
            fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
          }}>Log In</button>
          <button onClick={() => setMode("signup")} style={{
            flex: 1, padding: "9px", border: "none", borderRadius: "9px",
            background: mode === "signup" ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "transparent",
            color: mode === "signup" ? "white" : "rgba(255,255,255,0.6)",
            fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
          }}>Sign Up</button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#f87171", marginBottom: "16px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Google OAuth Section */}
        <div style={{ marginBottom: "16px" }}>
          <button onClick={handleGoogleClick} style={{
            width: "100%", padding: "12px", background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.16)", borderRadius: "12px",
            color: "white", fontWeight: "600", fontSize: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "all 0.2s"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </button>
        </div>

        {/* Demo Account Google Selector Popup */}
        {demoSimOpen && (
          <div style={{
            background: "rgba(15, 23, 42, 0.96)", border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: "14px", padding: "14px", marginBottom: "18px", boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
          }}>
            <div style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
              Choose a Google Account to Sign In
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button onClick={() => handleDemoGoogleSignIn("alex.morgan@gmail.com", "Alex Morgan")} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "white", cursor: "pointer", textAlign: "left"
              }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>A</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>Alex Morgan</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>alex.morgan@gmail.com</div>
                </div>
              </button>
              <button onClick={() => handleDemoGoogleSignIn("sarah.chen@gmail.com", "Sarah Chen")} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "white", cursor: "pointer", textAlign: "left"
              }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" }}>S</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>Sarah Chen</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>sarah.chen@gmail.com</div>
                </div>
              </button>
            </div>
            <button onClick={() => setDemoSimOpen(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "11px", width: "100%", marginTop: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>OR EMAIL</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "5px" }}>Full Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Alex Morgan"
                style={{
                  width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white",
                  fontSize: "13px", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "5px" }}>Email Address</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white",
                fontSize: "13px", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "5px" }}>Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "white",
                fontSize: "13px", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: "6px", width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
            border: "none", borderRadius: "12px", color: "white",
            fontWeight: "700", fontSize: "14px", cursor: loading ? "wait" : "pointer",
            boxShadow: "0 8px 20px -4px rgba(124, 58, 237, 0.5)", transition: "all 0.2s"
          }}>
            {loading ? "Processing..." : (mode === "signup" ? "Create Free Account" : "Sign In to Dashboard")}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes modalPop {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onOpenAuth, user, onGoToDashboard }) {
  const [demoTab, setDemoTab] = useState("breathing");
  const [breathPhase, setBreathPhase] = useState("Inhale (4s)");
  const [breathCount, setBreathCount] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          setBreathPhase((p) => {
            if (p.includes("Inhale")) return "Hold (4s)";
            if (p.includes("Hold (4s)")) return "Exhale (4s)";
            if (p.includes("Exhale")) return "Hold (4s)";
            return "Inhale (4s)";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#070913", color: "white",
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", overflowX: "hidden"
    }}>

      {/* ── TOP NAVIGATION HEADER ───────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(7, 9, 19, 0.88)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "16px 36px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)"
          }}>🧠</div>
          <span style={{
            fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px",
            fontFamily: "'Outfit', sans-serif",
            background: "linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Deprex
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          <a href="#features" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>Features</a>
          <a href="#ai-assistant" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>AI Assistant</a>
          <a href="#analytics" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>Mood Analytics</a>
          <a href="#relief" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>Stress Relief</a>
        </nav>

        {/* Top Right Auth Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <button onClick={onGoToDashboard} style={{
              padding: "10px 20px", borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              border: "none", color: "white", fontSize: "14px", fontWeight: "700",
              cursor: "pointer", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <span>Return to Dashboard</span> ➤
            </button>
          ) : (
            <>
              <button onClick={() => onOpenAuth("login")} style={{
                padding: "9px 18px", borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "white", fontSize: "14px", fontWeight: "600",
                cursor: "pointer", transition: "all 0.2s"
              }}>
                Log In
              </button>

              <button onClick={() => onOpenAuth("signup")} style={{
                padding: "9px 20px", borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                border: "none", color: "white", fontSize: "14px", fontWeight: "700",
                cursor: "pointer", boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
                transition: "all 0.2s"
              }}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", padding: "80px 24px 60px", maxWidth: "1200px", margin: "0 auto",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "350px", background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(37, 99, 235, 0.1) 50%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0
        }} />

        <div style={{
          position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "20px", background: "rgba(124, 58, 237, 0.12)",
          border: "1px solid rgba(124, 58, 237, 0.3)", color: "#c4b5fd", fontSize: "13px", fontWeight: "600",
          marginBottom: "24px"
        }}>
          ✨ Next-Gen AI Mental Wellness & Support Platform
        </div>

        <h1 style={{
          position: "relative", zIndex: 1, fontSize: "52px", fontWeight: "800", lineHeight: "1.15",
          letterSpacing: "-1.5px", maxWidth: "900px", margin: "0 0 20px", fontFamily: "'Outfit', sans-serif",
          background: "linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.7) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Empathy Powered by AI. <br />
          <span style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #38bdf8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Personalized to What You Love.
          </span>
        </h1>

        <p style={{
          position: "relative", zIndex: 1, fontSize: "18px", color: "rgba(255, 255, 255, 0.65)",
          maxWidth: "680px", lineHeight: "1.6", margin: "0 0 36px", fontWeight: "400"
        }}>
          Deprex combines 24/7 empathetic conversational support, automated sentiment tracking, and instant stress relief activities customized to your unique personal interests.
        </p>

        {/* Hero CTAs */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "60px" }}>
          <button onClick={() => onOpenAuth("signup")} style={{
            padding: "16px 36px", borderRadius: "14px",
            background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
            border: "none", color: "white", fontSize: "16px", fontWeight: "700",
            cursor: "pointer", boxShadow: "0 10px 30px -5px rgba(124, 58, 237, 0.6)",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            Get Started Free <span style={{ fontSize: "18px" }}>→</span>
          </button>

          <a href="#interactive-demo" style={{
            padding: "16px 30px", borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white", fontSize: "16px", fontWeight: "600", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "8px"
          }}>
            <span>Explore Demo</span> 🎮
          </a>
        </div>

        {/* Hero Preview Widget */}
        <div style={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: "940px",
          background: "linear-gradient(145deg, rgba(20, 24, 45, 0.8), rgba(12, 14, 28, 0.9))",
          border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "24px", padding: "28px",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(124, 58, 237, 0.15)",
          backdropFilter: "blur(20px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginLeft: "10px" }}>Deprex AI Hub • Live Preview</span>
            </div>
            <div style={{ fontSize: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 10px", borderRadius: "20px", fontWeight: "600" }}>
              ● Active Session
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", textAlign: "left" }}>
            {/* AI Snippet */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontSize: "12px", color: "#a78bfa", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>💬</span> AI COMPANION RESPONSE
              </div>
              <div style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", lineHeight: "1.5", color: "#e0e7ff" }}>
                "I noticed you love Chess and Lo-fi music. How about we try a quick 3-minute tactical puzzle session to clear your mind?"
              </div>
            </div>

            {/* Breathing Preview */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🌬️</span> LIVE BREATHING RESET
              </div>
              <div style={{ textAlign: "center", padding: "10px", background: "rgba(37, 99, 235, 0.1)", borderRadius: "12px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#93c5fd" }}>{breathPhase}</div>
                <div style={{ fontSize: "30px", fontWeight: "900", color: "white", margin: "2px 0" }}>{breathCount}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Resets autonomic nervous system</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", margin: "0 0 14px" }}>
            Designed for Holistic Emotional Well-being
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Combining cutting-edge GenAI with evidence-based mental health techniques.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {[
            {
              icon: "💬", title: "24/7 AI Support Chat",
              desc: "Empathetic, confidential conversational assistance tailored to your personal interests and emotional needs."
            },
            {
              icon: "📊", title: "Real-time Mood & Risk Analytics",
              desc: "Continuous mood analytics with proactive risk monitoring to keep you informed of emotional trends."
            },
            {
              icon: "🧩", title: "Interest-Based Relief",
              desc: "Customized puzzles, games, lo-fi audio, and breathing exercises tuned specifically to your hobbies."
            },
            {
              icon: "🛡️", title: "Crisis Safety & Privacy",
              desc: "Built-in safety protocols with immediate access to 988 emergency lifelines and encrypted logs."
            }
          ].map((f, i) => (
            <div key={i} style={{
              background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px", padding: "28px 24px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
            }}>
              <div style={{
                width: "50px", height: "50px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(37, 99, 235, 0.2))",
                border: "1px solid rgba(139, 92, 246, 0.3)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "24px", marginBottom: "18px"
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px", fontFamily: "'Outfit', sans-serif" }}>{f.title}</h3>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", lineHeight: "1.55", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ─────────────────────────────────────────────────── */}
      <section id="interactive-demo" style={{
        padding: "70px 24px", background: "rgba(15, 18, 37, 0.6)",
        borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", margin: "0 0 12px" }}>
            Experience Deprex Right Now
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", marginBottom: "30px" }}>
            Try out one of our instant stress-relief tools right from the landing page.
          </p>

          <div style={{
            background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px", padding: "28px", textAlign: "left"
          }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {["breathing", "puzzle", "chat"].map((t) => (
                <button key={t} onClick={() => setDemoTab(t)} style={{
                  padding: "8px 16px", borderRadius: "10px", border: "none",
                  background: demoTab === t ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "rgba(255,255,255,0.06)",
                  color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize"
                }}>
                  {t === "breathing" ? "🌬️ Box Breathing" : t === "puzzle" ? "♟️ Chess & Puzzles" : "💬 AI Companion"}
                </button>
              ))}
            </div>

            {demoTab === "breathing" && (
              <div style={{ textAlign: "center", padding: "30px 20px" }}>
                <div style={{ fontSize: "14px", color: "#a78bfa", fontWeight: "700", marginBottom: "8px" }}>GUIDED BREATHWORK</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "white", marginBottom: "6px" }}>{breathPhase}</div>
                <div style={{ fontSize: "42px", fontWeight: "900", color: "#60a5fa" }}>{breathCount}</div>
              </div>
            )}

            {demoTab === "puzzle" && (
              <div style={{ padding: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>♟️ Tactical Chess & Sudoku Exercises</div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.5" }}>
                  Solving light logic puzzles redirects focus away from anxious thoughts and calms brain activity.
                </p>
                <button onClick={() => onOpenAuth("signup")} style={{
                  padding: "10px 18px", background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)",
                  borderRadius: "10px", color: "#c4b5fd", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginTop: "10px"
                }}>
                  Unlock All Games & Puzzles →
                </button>
              </div>
            )}

            {demoTab === "chat" && (
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🧠</div>
                  <div style={{ background: "rgba(255,255,255,0.08)", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", maxWidth: "80%" }}>
                    "Hello! I am Deprex. I'm here to listen, support, and help you find peace whenever you need it."
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CRISIS & FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <div style={{
          maxWidth: "800px", margin: "0 auto 24px", background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px", padding: "14px 20px"
        }}>
          <span style={{ color: "#f87171", fontWeight: "700", fontSize: "14px" }}>🚨 Immediate Crisis Assistance: </span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
            If you are in distress, call or text <strong style={{ color: "white" }}>988</strong> (US/Canada) or visit your nearest emergency room.
          </span>
        </div>

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
          © {new Date().getFullYear()} Deprex AI. Confidential Mental Health Companion.
        </p>
      </footer>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function Deprex(){
  const[user,setUser]=useState(null);
  const[view,setView]=useState("home"); // "home" | "app"
  const[tab,setTab]=useState("dashboard");
  const[authModal,setAuthModal]=useState({open:false,mode:"login"});
  const[reliefEvents,setReliefEvents]=useState([]);
  const[chatEvents,setChatEvents]=useState([]);
  const[journals,setJournals]=useState([]);
  const[assessHistory,setAssessHistory]=useState([]);
  const[loading,setLoading]=useState(true);

  // ── Boot: restore session from saved JWT or handle OAuth return ────────────
  useEffect(()=>{
    if (window.location.hash.includes("access_token=")) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        window.history.replaceState(null, "", window.location.pathname);
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.json())
          .then(info => {
            if (info.email) {
              return apiFetch("/auth/google", {
                method: "POST",
                body: { credential: "google_oauth_redirect", email: info.email, name: info.name || info.given_name }
              });
            }
          })
          .then(data => {
            if (data?.access_token) {
              localStorage.setItem("dx_token", data.access_token);
              setUser(data.user);
              setView("app");
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
        return;
      }
    }

    const token=localStorage.getItem("dx_token");
    if(!token){setLoading(false);return;}
    apiFetch("/auth/me").then(u=>{
      setUser(u);
      setView("app");
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
    setView("app");
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
    setUser(null);
    setView("home");
    setTab("dashboard");
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

  const bg={minHeight:"100vh",background:"radial-gradient(ellipse at 20% 10%, #1a0a2e 0%, #0a0a14 45%, #091220 100%)",color:"white",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};

  if(loading) return(
    <div style={{...bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
      <div style={{fontSize:"40px"}}>🧠</div>
      <div style={{color:"rgba(255,255,255,0.5)",fontSize:"14px"}}>Loading Deprex…</div>
    </div>
  );

  // Home Landing view (shown to guest visitors OR logged in users viewing home)
  if(view === "home" || !user) return (
    <div style={bg}>
      <LandingPage
        user={user}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onGoToDashboard={() => setView("app")}
      />
      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, open: false })}
        onAuthSuccess={handleAuth}
      />
    </div>
  );

  if(!user.onboarded) return <div style={bg}><OnboardingChat user={user} onComplete={saveInterests}/></div>;

  return(
    <div style={{...bg,display:"flex",overflow:"hidden"}}>
      <Sidebar tab={tab} setTab={setTab} user={user} logout={handleLogout} risk={risk} onGoHome={() => setView("home")}/>
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
