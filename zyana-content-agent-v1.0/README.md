# Zyana Content Agent v1.0

> AI-powered content command center for founders building in public — built by [Naqiyah](https://github.com/Zyananaqiyahlk) at [Zyana Systems](https://zyanasystems.com)

![Zyana Content Agent](https://img.shields.io/badge/version-1.0.0-gold) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![License](https://img.shields.io/badge/license-Commercial-gold)

---

## What It Does

The Zyana Content Agent is a full-stack React application that acts as your AI-powered content strategist, script writer, engagement analyst, and brand outreach manager — all in one dark-mode dashboard.

Built for founders running a 90-day "building in public" content series targeting 10K followers and UGC brand deals.

---

## Features

**Script Generator** — Generate ready-to-film scripts for Talking Head, Screen Recording, Case Study, Educational, and Vlog formats. Includes voice input (Speech-to-Text) and text-to-speech playback. Supports all major platforms (Instagram Reels, TikTok, YouTube Shorts, LinkedIn).

**Video Studio** — Higgsfield AI integration for AI-generated video content directly from the dashboard.

**Engagement Tracker** — Input your real metrics and get AI analysis with Recharts-powered visualizations. Monthly goal tracking, platform breakdowns, and per-video performance.

**Brand Outreach** — Pipeline manager for 8 pre-loaded brand prospects (n8n, Make.com, GoHighLevel, Bland AI, OpenAI, and more). AI-generates personalized outreach emails, follow-up sequences, and LinkedIn DM versions.

**Media Kit Builder** — AI-written media kit with editable rate card ($500 / $1,500 / $2,500 tiers). Export as .txt with one click.

**Agent Chat** — Conversational AI brain with active learning. Every 4 messages it extracts and stores strategic insights. Voice input + TTS output. Quick-prompt shortcuts included.

---

## Tech Stack

- **React 18** + **Vite 5** — Fast modern frontend
- **Zustand 4** with persist middleware — All state saved to localStorage
- **Recharts 2** — Analytics charts
- **Tailwind CSS 3** — Custom gold/dark design system
- **Lucide React** — Icons
- **Claude claude-sonnet-4-20250514** — AI backbone (bring your own Anthropic API key)
- **Web Speech API** — Voice input + TTS (Chrome recommended)

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Zyananaqiyahlk/Content-Agent-Studio.git
cd Content-Agent-Studio

# Install dependencies
npm install

# Start the dev server
npm run dev
# Opens at http://localhost:5173
```

**You'll need an Anthropic API key** to unlock all AI features. Get one at [console.anthropic.com](https://console.anthropic.com). Add it in the app under Settings, or on the onboarding screen.

---

## Build for Production

```bash
npm run build
# Output in dist/

npm run preview
# Preview the production build locally
```

---

## Project Structure

```
src/
├── App.jsx                  — Shell, sidebar, routing, onboarding modal
├── store.js                 — All Zustand state (persisted to localStorage)
├── agents/
│   ├── brain.js             — Claude API + TTS + STT utilities
│   └── higgsfield.js        — Higgsfield video generation API
├── components/
│   ├── Dashboard.jsx        — Mission tracker, metrics, tasks, content calendar
│   ├── ScriptGenerator.jsx  — AI script generation with voice I/O
│   ├── VideoStudio.jsx      — Higgsfield AI video generation
│   ├── EngagementTracker.jsx— Metrics input, charts, AI analysis
│   ├── BrandOutreach.jsx    — Prospect pipeline + AI email generation
│   ├── MediaKit.jsx         — AI media kit builder with rate card
│   ├── AgentChat.jsx        — Conversational AI with active learning
│   └── Settings.jsx         — API keys, profile, reset
└── styles/
    └── index.css            — Tailwind + CSS custom properties
```

---

## Content Strategy Context

This app was purpose-built for a **90-day public content series**:

- **Phase 1 (Days 1–30):** Foundation — introduce the brand and niche
- **Phase 2 (Days 31–60):** Authority — case studies and deep dives
- **Phase 3 (Days 61–90):** Conversion — brand deals and monetization

Target niches: AI automation for **clinics**, **hotels**, **restaurants**, and **real estate agents**.

Pre-loaded ManyChat keywords: `REAL ESTATE`, `HOTEL`, `CLINIC`

---

## Environment Variables (Optional)

To pre-fill your API key in development (never commit this):

```bash
# .env.local
VITE_ANTHROPIC_KEY=sk-ant-...
VITE_HIGGSFIELD_KEY=your-key
```

---

## Pricing Tiers (Gumroad)

| Tier | Price | License |
|---|---|---|
| Solo | $47 | 1 user, personal use |
| Agency | $197 | Unlimited clients |
| White Label | $497 | Rebrand + resell |

---

## License

Commercial license. See LICENSE for terms. Not for redistribution without purchase.

---

*Built by Naqiyah · Zyana Systems · AI Automation for Small Businesses*
