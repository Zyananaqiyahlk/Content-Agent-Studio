# CLAUDE.md — Zyana Content Agent
## Instructions for Claude Code

> This file tells Claude Code exactly how to build, run, and extend the **Zyana Content Agent** — a production React + Vite application for Naqiyah's AI automation agency **Zyana Systems**.

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| Product | Zyana Content Agent v1.0 |
| Founder | Naqiyah |
| Brand | Zyana Systems |
| Niche | AI automation for small businesses (clinics, hotels, real estate, restaurants) |
| Goal | 10K followers in 90 days → UGC brand deals |
| Platforms | Instagram Reels, TikTok, YouTube Shorts, LinkedIn, X/Twitter |
| Current Phase | Day 7 of 90-day public content series |
| ManyChat Keywords | REAL ESTATE (Day 5), HOTEL (Day 6), CLINIC (Day 7) |

---

## 2. TECH STACK — USE EXACTLY THIS

```
React 18
Vite 5
Zustand 4 (with persist middleware → localStorage)
Recharts 2
Tailwind CSS 3
Lucide React (icons only — no emoji icons in UI)
date-fns (date formatting)
```

**DO NOT use:**
- Next.js
- Redux
- MUI / Chakra / Ant Design (use Tailwind only)
- Any other UI component library

---

## 3. INITIAL SETUP COMMANDS

When starting from scratch, run these in order:

```bash
npm create vite@latest zyana-content-agent -- --template react
cd zyana-content-agent
npm install zustand recharts lucide-react date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

Then open `http://localhost:5173`

---

## 4. FILE STRUCTURE — BUILD EXACTLY THIS

```
zyana-content-agent/
├── CLAUDE.md                    ← this file
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── .gitignore
├── public/
│   └── favicon.svg              ← Z logo in gold
└── src/
    ├── main.jsx                 ← ReactDOM.createRoot entry
    ├── App.jsx                  ← sidebar + routing + onboarding
    ├── store.js                 ← ALL Zustand state here
    ├── styles/
    │   └── index.css            ← Tailwind + custom CSS vars
    └── components/
        ├── Dashboard.jsx        ← Skill 0: overview + tasks
        ├── ScriptGenerator.jsx  ← Skill 1: AI script generation
        ├── EngagementTracker.jsx← Skill 2: metrics + charts
        ├── BrandOutreach.jsx    ← Skill 3: email pipeline
        ├── MediaKit.jsx         ← Skill 4: media kit builder
        ├── AgentChat.jsx        ← Agent Brain: voice + chat
        └── Settings.jsx         ← API key + git instructions
```

---

## 5. DESIGN SYSTEM — FOLLOW THIS EXACTLY

### Colors (CSS variables in `src/styles/index.css`)
```css
:root {
  --gold: #D4A843;
  --gold-bright: #F0C060;
  --gold-dim: #8B6B2A;
  --bg: #0A0A0B;
  --surface: #0E0E11;
  --card: #18181C;
  --card-hover: #1F1F24;
  --border: rgba(212,168,67,0.15);
  --border-sub: rgba(255,255,255,0.06);
  --text: #F0EDE6;
  --muted: #888580;
}
```

### Typography
- **Headings**: `font-family: 'Syne', sans-serif` — import from Google Fonts
- **Body**: `font-family: 'DM Sans', sans-serif` — import from Google Fonts
- Add to `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
```

### Tailwind Config
```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { 400: '#E8C454', 500: '#D4A843', 600: '#B8892E', 700: '#8B6B2A' },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      }
    }
  }
}
```

### Component Patterns
```jsx
// Card
<div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 hover:border-gold-500/20 transition-colors">

// Gold button
<button className="bg-gradient-to-r from-gold-500 to-gold-600 text-black font-syne font-bold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity flex items-center gap-2">

// Ghost button
<button className="border border-white/10 text-zinc-400 rounded-xl px-4 py-2 text-sm font-dm hover:text-white hover:border-white/20 transition-all flex items-center gap-2">

// Input
<input className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-500/50 transition-colors font-dm" />

// Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-syne font-semibold bg-gold-500/15 text-gold-500">

// Metric card
<div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-semibold">LABEL</p>
  <p className="text-2xl font-syne font-bold text-white leading-none">VALUE</p>
  <p className="text-xs text-emerald-400 mt-1.5">change</p>
</div>
```

---

## 6. ZUSTAND STORE (`src/store.js`)

The store must use `persist` middleware saving to `localStorage` key `'zyana-agent-v1'`.

### Required State Slices:

```js
// PROFILE
apiKey: '',           // Anthropic API key
profileName: 'Naqiyah',
brandName: 'Zyana Systems',
niche: 'AI automation for small businesses',
onboarded: false,

// MISSION
currentDay: 7,
targetFollowers: 10000,

// METRICS (user updates these from real data)
metrics: {
  followers: 50,
  engagement: 0,      // percentage
  avgViews: 0,
  emailSubs: 0,
  dmInquiries: 0,
  scriptsGenerated: 0,
  outreachSent: 0,
  brandDeals: 0,
},

// NAVIGATION
activeTab: 'dashboard',

// SCRIPTS
generatedScripts: [],   // [{id, topic, format, platform, content, createdAt}]

// BRAND PROSPECTS
brandProspects: [...],  // see Section 9

// CHAT
chatHistory: [],        // [{role, content, timestamp}]

// LEARNING
learnings: [],          // [{id, insight, category, timestamp}]

// CONTENT PLAN
completedDays: [],      // day numbers marked done

// AUDIO
audioEnabled: false,

// MEDIA KIT
rateCard: { singleVideo: 500, bundle3x: 1500, monthly: 2500 }
```

### Required Actions:
```js
setApiKey, setOnboarded, setProfile, setActiveTab,
updateMetrics, addScript, clearScripts,
updateProspect, addProspect,
addMessage, clearChat,
addLearning,
setAudioEnabled,
markDayComplete,
updateRateCard,
```

---

## 7. CLAUDE API INTEGRATION (`src/agents/brain.js`)

### Constants
```js
const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1500
```

### System Prompt (inject into EVERY API call)
```
You are the Zyana Systems Content Agent — AI strategist for Naqiyah's brand media outlet.

BRAND: Zyana Systems. AI automation agency for small businesses (clinics, hotels, restaurants, real estate agents).
MISSION: 90-day public content series documenting AI agent builds. Currently Day 7. Goal: 10K followers → UGC brand deals.
VOICE: Founder-to-peer. Authentic. Data-backed. Direct. "Building in public" energy. NOT corporate.
PLATFORMS: Instagram Reels, TikTok, YouTube Shorts, LinkedIn, X/Twitter.

FOUR SKILLS:
1. Script Generator — produce ready-to-film scripts with [HOOK], [BODY], [CTA], timing marks, [PAUSE] directions, platform tips
2. Engagement Analyst — analyze metrics, find patterns, give specific recommendations
3. Brand Outreach — write personalized outreach emails (NOT generic) for UGC deals
4. Media Kit Builder — write premium, brand-forward media kit copy

RULES:
- Always be specific: use numbers, business types, exact hooks
- Lead with most actionable insight first
- When generating scripts: always include Hook (3s), Body (40-50s), CTA (8-10s), timing, platform tips
- Reference 90-day phases: Phase 1 (Days 1-30 Foundation), Phase 2 (Days 31-60 Authority), Phase 3 (Days 61-90 Conversion)
```

### API Call Function
```js
export async function callClaude(prompt, apiKey, history = []) {
  if (!apiKey) return '⚠️ Add your Anthropic API key in Settings to unlock AI generation.'
  
  const messages = history.length
    ? [...history.slice(-6), { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }]

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, messages }),
  })
  
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}
```

### Error Handling
- Always wrap in try/catch
- Show error inline in the UI (not alert())
- If no API key → show a clear prompt to go to Settings

---

## 8. COMPONENT SPECS

### `App.jsx` — Shell
- Fixed left sidebar (220px wide) with nav groups: OVERVIEW, CREATE, MONETIZE, CONFIG
- Top bar with page title, toggle sidebar button, agent status dot (green = API key set)
- Onboarding modal on first launch — asks for API key, shows 4 feature cards
- `useStore` for `activeTab` — render correct component in main area
- Sidebar collapses on mobile (hamburger)

### `Dashboard.jsx`
Must include:
1. Greeting: "Good morning, Naqiyah" + current phase label
2. 10K Follower Mission — progress bar (`followers / 10000 * 100`), followers needed per day
3. Metric grid — 5 cards: Followers, Engagement %, Scripts, Brand Prospects, DM Inquiries
4. Growth trajectory — `<AreaChart>` from Recharts showing weeks 1-12 (actual vs target data)
5. Today's task checklist — 6 tasks for Day 7, toggleable with local state, urgent badges
6. Content calendar preview — Days 5-9 with format, platform, completion status

### `ScriptGenerator.jsx` — Skill 1
Must include:
1. Format selector (pill buttons): Talking Head, Screen Recording, Case Study, Educational, Vlog
2. Platform dropdown: Instagram Reels, TikTok, YouTube Shorts, All Platforms, LinkedIn
3. Audience dropdown: Small business owners, Clinic owners, Real estate agents, Restaurant owners, Hotel managers, Founders
4. Topic textarea + 5 quick-pick buttons
5. Generate button → calls `callClaude()` → shows result in right panel
6. Script output panel: shows formatted script, Copy button, Listen button (TTS), Download as .txt, Regenerate
7. Recent scripts list (last 8) clickable to reload
8. Mic button for voice topic input using Web Speech API

**Script prompt template:**
```
Generate a complete ready-to-film ${format} script for Zyana Systems.
TOPIC: ${topic}
FORMAT: ${format}
PLATFORM: ${platform}
TARGET AUDIENCE: ${audience}

Structure EXACTLY:
**HOOK (3 seconds)**
[opening line — bold, specific, stops the scroll]

**BODY (${format === 'Vlog' ? '60' : '45'} seconds)**
[full script with [PAUSE] markers and [SHOW SCREEN] directions]

**CTA (10 seconds)**
[specific call to action]

**PRODUCTION NOTES**
- Total duration: X seconds
- Platform tips for ${platform}
- Trending angle
- B-roll suggestions
```

### `EngagementTracker.jsx` — Skill 2
Must include:
1. Metric input form (6 fields) — saves to Zustand store + localStorage
2. Monthly goals with progress bars (followers → 800, engagement → 8%, email subs → 50)
3. `<BarChart>` — views per video (simulated data for Days 1-7)
4. `<BarChart>` — engagement rate per video
5. Platform breakdown cards (Instagram, TikTok, YouTube)
6. "Get AI Analysis" button → calls Claude with current metrics → displays insight inline
7. Video performance list — recent videos with metrics rows

### `BrandOutreach.jsx` — Skill 3
Must include:
1. Pipeline summary row — count per stage (Prospect, Contacted, Interested, Negotiating, Closed)
2. Filter buttons by status
3. Brand cards list (left column) — each card shows: name, category, relevance %, notes, status badge, "Generate Email" button, status dropdown
4. Email output panel (right column) — displays generated email with Copy + Open in Mail buttons
5. "Add Brand" form — name, category, email, notes fields
6. Follow-up section in generated email

**Outreach prompt template:**
```
Write a personalized UGC brand partnership outreach email from Naqiyah at Zyana Systems to ${brand.name}.
Brand category: ${brand.category}
Why they fit: ${brand.notes}
My stats: ${followers} followers growing to 10K in 90 days, ${engagement}% avg engagement, AI automation niche.
Rules: mention something specific about ${brand.name}, under 200 words, value-first, confident founder-to-founder tone.
Output: Subject line + email body + 5-day follow-up version + LinkedIn DM version (75 words).
```

### `MediaKit.jsx` — Skill 4
Must include:
1. Rate card at top — 3 pricing tiers, editable inputs
2. 5 collapsible sections, each with "Generate" button:
   - About Zyana Systems
   - Audience Stats & Demographics
   - Engagement Highlights
   - Partnership Packages
   - Why Partner With Us
3. Each section: generated AI copy displays below the button, with Copy button
4. "Export Full Kit" button — compiles all sections into a downloadable .txt file

### `AgentChat.jsx` — Agent Brain
Must include:
1. Chat message thread (scrollable, auto-scroll to bottom)
2. User bubbles (right, gold tint) and agent bubbles (left, zinc)
3. Agent avatar (🧠 or Z logo circle)
4. 8 quick prompt buttons shown when chat is empty
5. Textarea input — Enter to send, Shift+Enter for newline
6. Mic button → Web Speech API voice input
7. Audio toggle → TTS output using `window.speechSynthesis`
8. Browser shortcut buttons: Google Trends, n8n search, UGC rates
9. Learning badges row — shows last 4 extracted insights
10. Clear chat button
11. Active learning: every 4 messages, extract insights via Claude → store in Zustand

**Learning extraction prompt:**
```
Analyze this conversation and extract 1-2 learnable insights about Zyana's content strategy, tone, audience, or what's working.
Return ONLY a JSON array: [{"insight": "...", "category": "content|engagement|outreach|tone"}]
If no clear learnings: return []
Conversation:
${last 4 messages}
```

### `Settings.jsx`
Must include:
1. API key field (password type) — saves to localStorage via Zustand
2. Profile fields: Your Name, Brand Name, Niche
3. Git setup code block with copy button
4. Build & sell instructions
5. Suggested pricing table: $47 / $197 / $497
6. Audio settings toggle
7. "Reset All Data" button (clears localStorage)

---

## 9. BRAND PROSPECTS DATA (pre-load in store)

```js
const INITIAL_PROSPECTS = [
  { id: 1, name: 'n8n', category: 'Automation Tool', email: 'partnerships@n8n.io', status: 'prospect', relevance: 98, notes: 'Core tool Naqiyah uses — most authentic fit possible' },
  { id: 2, name: 'Make.com', category: 'Automation Tool', email: 'partners@make.com', status: 'prospect', relevance: 92, notes: 'Strong SMB automation focus, competes with Zapier' },
  { id: 3, name: 'GoHighLevel', category: 'CRM/Marketing', email: 'collab@gohighlevel.com', status: 'contacted', relevance: 95, notes: 'Perfect overlap with small business owner audience' },
  { id: 4, name: 'Calendly', category: 'Scheduling', email: 'partners@calendly.com', status: 'interested', relevance: 85, notes: 'Appointment booking — directly relevant to clinic agent demos' },
  { id: 5, name: 'Bland AI', category: 'Voice AI', email: 'hello@bland.ai', status: 'prospect', relevance: 94, notes: 'AI phone calls — powers the front desk agent demos' },
  { id: 6, name: 'Twilio', category: 'Communications API', email: 'partners@twilio.com', status: 'prospect', relevance: 82, notes: 'Powers SMS reminder agents for clinics and restaurants' },
  { id: 7, name: 'OpenAI', category: 'AI Platform', email: 'partnerships@openai.com', status: 'prospect', relevance: 97, notes: 'Powers all AI agent logic — deeply authentic integration' },
  { id: 8, name: 'ClickUp', category: 'Project Management', email: 'affiliates@clickup.com', status: 'prospect', relevance: 78, notes: 'SMB productivity tool used by target audience' },
]
```

---

## 10. CONTENT PLAN DATA (Days 1-30)

Pre-load these in the store for the content calendar:

```js
const CONTENT_PLAN = [
  { day: 1, format: 'Talking Head', topic: 'I built an AI to help myself, now I\'m helping small businesses', platform: ['Instagram Reels', 'TikTok'] },
  { day: 2, format: 'Story Series', topic: 'Behind-the-scenes: workspace and tools (n8n, AI)', platform: ['Instagram Stories'] },
  { day: 3, format: 'Screen Recording', topic: 'What is n8n? The tool I use to build AI agents', platform: ['YouTube Shorts', 'TikTok'] },
  { day: 4, format: 'Talking Head', topic: '3 tasks I automated that saved me 10 hours/week', platform: ['Instagram Reels'] },
  { day: 5, format: 'Talking Head', topic: 'Real estate agents: Stop manually entering leads', platform: ['TikTok', 'Instagram Reels'] },
  { day: 6, format: 'Screen Recording', topic: 'Building a hotel AI front desk agent — full demo', platform: ['YouTube Shorts', 'TikTok'] },
  { day: 7, format: 'Talking Head', topic: 'Healthcare Clinic AI Front Desk Agent reveal', platform: ['Instagram Reels', 'TikTok'] },
  { day: 8, format: 'Case Study', topic: 'Clinic owner saved 14 hrs/week with this agent', platform: ['Instagram Reels', 'TikTok'] },
  { day: 9, format: 'Vlog', topic: 'Day in my life as a founder building automation', platform: ['TikTok', 'YouTube Shorts'] },
  { day: 10, format: 'Screen Recording', topic: 'Watch me build a review-reply agent in 5 minutes', platform: ['Instagram Reels'] },
  { day: 11, format: 'Case Study', topic: 'Before/After: Salon reduced no-shows by 60%', platform: ['TikTok', 'YouTube Shorts'] },
  { day: 15, format: 'Talking Head', topic: 'AI agents are the future of small business', platform: ['Instagram Reels'] },
  { day: 22, format: 'Talking Head', topic: 'I\'m building a $10K/month automation business — here\'s my plan', platform: ['Instagram Reels', 'TikTok'] },
  { day: 29, format: 'Case Study', topic: 'Clinic owner saved 14 hours/week — full breakdown', platform: ['Instagram Reels', 'TikTok'] },
]
```

---

## 11. AUDIO (TTS + STT)

### Text-to-Speech
```js
export function speak(text, onStart, onEnd) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  
  // Clean markdown from text before speaking
  const clean = text
    .replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '').replace(/\[([^\]]+)\]/g, '$1')
    .trim().substring(0, 800)
  
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 0.95
  utterance.pitch = 1.05
  utterance.volume = 1
  
  // Prefer natural-sounding voice
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    v.name.includes('Samantha') ||
    v.name.includes('Google US English') ||
    (v.lang === 'en-US' && !v.name.includes('Zira'))
  )
  if (preferred) utterance.voice = preferred
  
  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}
```

### Voice Input (Speech-to-Text)
```js
export function startListening(onResult, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onError('Voice input not supported. Use Chrome.'); return null }
  
  const recognition = new SR()
  recognition.lang = 'en-US'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (e) => onResult(e.results[0][0].transcript)
  recognition.onerror = (e) => onError(e.error)
  recognition.start()
  return recognition
}
```

---

## 12. GROWTH CHART DATA

Use this simulated trajectory in `Dashboard.jsx`:

```js
const GROWTH_DATA = [
  { week: 'W1', actual: 50, target: 200 },
  { week: 'W2', actual: 180, target: 450 },
  { week: 'W3', actual: 380, target: 800 },
  { week: 'W4', actual: 680, target: 1200 },
  { week: 'W5', actual: 1100, target: 2000 },
  { week: 'W6', actual: 1800, target: 3000 },
  { week: 'W7', actual: 2800, target: 4500 },
  { week: 'W8', actual: 4200, target: 6000 },
  { week: 'W9', actual: 6000, target: 7500 },
  { week: 'W10', actual: 8200, target: 9000 },
  { week: 'W11', actual: 9400, target: 9800 },
  { week: 'W12', actual: 10500, target: 10500 },
]
```

Chart: `<AreaChart>` from Recharts. Gold fill for actual, dashed gold line for target.

---

## 13. TODAY'S TASKS (Day 7)

```js
const DAY_7_TASKS = [
  { id: 't1', text: 'Film Day 7 — Healthcare Clinic AI Front Desk Agent reveal', type: 'content', urgent: true },
  { id: 't2', text: 'Post Day 6 Hotel recap + activate ManyChat keyword "HOTEL"', type: 'publish', urgent: true },
  { id: 't3', text: 'Engage 25+ accounts in AI/small business niche (30 min)', type: 'engagement', urgent: false },
  { id: 't4', text: 'Add captions to Day 5 Real Estate Reel for Instagram', type: 'edit', urgent: false },
  { id: 't5', text: 'Follow up with GoHighLevel in brand outreach pipeline', type: 'outreach', urgent: false },
  { id: 't6', text: 'Post 2 IG Stories: poll + BTS from today\'s shoot', type: 'stories', urgent: false },
]
```

---

## 14. ANIMATIONS & INTERACTIONS

- Page load: `opacity-0 → opacity-100` with `translateY(12px) → translateY(0)` over 400ms
- Card hover: `border-white/5 → border-gold-500/20` transition
- Buttons: `transform: scale(0.98)` on active
- Progress bars: animate width on mount using `useEffect` + CSS transition
- Metric values: count-up animation from 0 to target value on mount
- Spinner: rotating border for loading states (use Tailwind `animate-spin`)
- Chat messages: slide in from bottom

---

## 15. RUNNING THE APP

```bash
# Development
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build
# Output in dist/

# Preview production build
npm run preview
```

---

## 16. GIT WORKFLOW

```bash
git init
git add .
git commit -m "feat: Zyana Content Agent v1.0

- Dashboard with 10K follower mission tracker
- Script Generator with Claude AI + voice input/TTS
- Engagement Tracker with Recharts analytics
- Brand Outreach Manager with AI email generation
- Media Kit Generator with rate card
- Agent Brain Chat with active learning"

git remote add origin https://github.com/YOUR_USERNAME/zyana-content-agent
git push -u origin main
```

---

## 17. PRODUCT DISTRIBUTION

After `npm run build`:

```bash
# Zip for Gumroad/LemonSqueezy
zip -r zyana-content-agent-v1.0.zip dist/ README.md package.json CLAUDE.md

# Buyers install with:
# npm install && npm run dev
```

**Pricing tiers:**
| Tier | Price | License |
|---|---|---|
| Solo | $47 | 1 user, personal use |
| Agency | $197 | Unlimited clients |
| White Label | $497 | Rebrand + resell |

---

## 18. COMMON CLAUDE CODE COMMANDS

When working in this project with Claude Code, use these prompts:

```
"Add a Notion integration to the content calendar using the Notion MCP"
"Add a LinkedIn post generator to the Script Generator tab"
"Build a Canva thumbnail generator that opens Canva with the right dimensions"
"Add a countdown timer to the Agent Chat for filming sessions"
"Create an export to Notion button on the Dashboard that saves today's tasks"
"Add a dark/light mode toggle to Settings"
"Build a hashtag generator component in Script Generator"
"Add email list management with ConvertKit API integration"
```

---

## 19. ENVIRONMENT VARIABLES (optional)

If you want to pre-set the API key for development (never commit this):

```bash
# .env.local (gitignored)
VITE_ANTHROPIC_KEY=sk-ant-...
```

Then in `store.js`:
```js
apiKey: import.meta.env.VITE_ANTHROPIC_KEY || '',
```

---

## 20. KNOWN ISSUES & FIXES

| Issue | Fix |
|---|---|
| `getVoices()` returns empty array | Wrap in `speechSynthesis.onvoiceschanged` event |
| Recharts not responsive | Wrap in `<ResponsiveContainer width="100%" height={200}>` |
| Zustand persist not working | Ensure `@zustand/middleware` and `persist` imported correctly |
| API key visible in network tab | This is expected — key is sent from browser. For production, proxy through a backend |
| TTS cuts off long responses | Limit to 800 chars — already handled in `speak()` |
| Voice input only works in Chrome | Check for `window.SpeechRecognition || window.webkitSpeechRecognition` |

---

*Built for Zyana Systems · AI Automation Agency · zyanasystems.com*
*Claude Code file — keep this in the project root*
