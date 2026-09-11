// ─── DEPREX DOMAIN RESOURCE CATALOG ──────────────────────────────────────────
// Static wellness catalogs, interest taxonomy, and question definitions.

export const QUICK_TECHNIQUES = [
  { icon:"🌬️", title:"Box Breathing", desc:"Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4x.", time:"2 min" },
  { icon:"🌊", title:"5-4-3-2-1 Grounding", desc:"Name 5 things you see, 4 hear, 3 touch, 2 smell, 1 taste.", time:"3 min" },
  { icon:"🧘", title:"Progressive Muscle Relax", desc:"Tense each muscle group 5s then release, toes to head.", time:"5 min" },
  { icon:"💧", title:"Cold Water Reset", desc:"Splash cold water on face — resets the nervous system instantly.", time:"1 min" },
  { icon:"✍️", title:"Worry Dump", desc:"Write every worry uncensored on paper — getting it out reduces it.", time:"5 min" },
  { icon:"☀️", title:"Sunlight Break", desc:"Step outside for 5 minutes. Natural light boosts serotonin and mood.", time:"5 min" },
];


export const INTEREST_CATEGORIES = [
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



export // Each key maps to tailored resources for that exact interest
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



export const ASSESSMENT_QUESTIONS = [
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



export const MOCK_TREND = [
  {date:"Feb 4",mood:58,risk:30},{date:"Feb 8",mood:52,risk:38},{date:"Feb 12",mood:68,risk:24},
  {date:"Feb 16",mood:45,risk:52},{date:"Feb 20",mood:60,risk:40},{date:"Feb 24",mood:66,risk:29},{date:"Feb 28",mood:74,risk:18},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────


export function getPlaceholderHint(interest) {
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
    "Meditation": "Body scan and breathing exercises, under 10 minutes",
    "Yoga": "Morning flow and beginner-friendly sessions",
  };
  return hints[interest] || `describe what you specifically enjoy about ${interest}`;
}



// Which INTEREST_CATEGORIES category does an interest belong to?
export function getCategoryFor(interest) {
  for(const cat of INTEREST_CATEGORIES){
    if(cat.items.includes(interest)) return cat.category;
  }
  return "Other";
}


