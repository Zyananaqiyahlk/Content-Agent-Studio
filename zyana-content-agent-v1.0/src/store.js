import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

const DAY_7_TASKS = [
  { id: 't1', text: 'Film Day 7 — Healthcare Clinic AI Front Desk Agent reveal', type: 'content', urgent: true, done: false },
  { id: 't2', text: 'Post Day 6 Hotel recap + activate ManyChat keyword "HOTEL"', type: 'publish', urgent: true, done: false },
  { id: 't3', text: 'Engage 25+ accounts in AI/small business niche (30 min)', type: 'engagement', urgent: false, done: false },
  { id: 't4', text: 'Add captions to Day 5 Real Estate Reel for Instagram', type: 'edit', urgent: false, done: false },
  { id: 't5', text: 'Follow up with GoHighLevel in brand outreach pipeline', type: 'outreach', urgent: false, done: false },
  { id: 't6', text: "Post 2 IG Stories: poll + BTS from today's shoot", type: 'stories', urgent: false, done: false },
]

export const CONTENT_PLAN = [
  { day: 1, format: 'Talking Head', topic: "I built an AI to help myself, now I'm helping small businesses", platform: ['Instagram Reels', 'TikTok'], done: true },
  { day: 2, format: 'Story Series', topic: 'Behind-the-scenes: workspace and tools (n8n, AI)', platform: ['Instagram Stories'], done: true },
  { day: 3, format: 'Screen Recording', topic: 'What is n8n? The tool I use to build AI agents', platform: ['YouTube Shorts', 'TikTok'], done: true },
  { day: 4, format: 'Talking Head', topic: '3 tasks I automated that saved me 10 hours/week', platform: ['Instagram Reels'], done: true },
  { day: 5, format: 'Talking Head', topic: 'Real estate agents: Stop manually entering leads', platform: ['TikTok', 'Instagram Reels'], done: true },
  { day: 6, format: 'Screen Recording', topic: 'Building a hotel AI front desk agent — full demo', platform: ['YouTube Shorts', 'TikTok'], done: true },
  { day: 7, format: 'Talking Head', topic: 'Healthcare Clinic AI Front Desk Agent reveal', platform: ['Instagram Reels', 'TikTok'], done: false },
  { day: 8, format: 'Case Study', topic: 'Clinic owner saved 14 hrs/week with this agent', platform: ['Instagram Reels', 'TikTok'], done: false },
  { day: 9, format: 'Vlog', topic: 'Day in my life as a founder building automation', platform: ['TikTok', 'YouTube Shorts'], done: false },
  { day: 10, format: 'Screen Recording', topic: 'Watch me build a review-reply agent in 5 minutes', platform: ['Instagram Reels'], done: false },
  { day: 11, format: 'Case Study', topic: 'Before/After: Salon reduced no-shows by 60%', platform: ['TikTok', 'YouTube Shorts'], done: false },
]

export const GROWTH_DATA = [
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

export const useStore = create(
  persist(
    (set) => ({
      apiKey: '',
      higgsfieldKey: '',
      higgsfieldSecret: '',
      videoGenerations: [],
      profileName: 'Naqiyah',
      brandName: 'Zyana Systems',
      niche: 'AI automation for small businesses',
      onboarded: false,
      currentDay: 7,
      targetFollowers: 10000,
      metrics: { followers: 50, engagement: 0, avgViews: 0, emailSubs: 0, dmInquiries: 0, scriptsGenerated: 0, outreachSent: 0, brandDeals: 0 },
      activeTab: 'dashboard',
      generatedScripts: [],
      brandProspects: INITIAL_PROSPECTS,
      chatHistory: [],
      learnings: [],
      contentPlan: CONTENT_PLAN,
      tasks: DAY_7_TASKS,
      completedDays: [1, 2, 3, 4, 5, 6],
      audioEnabled: false,
      rateCard: { singleVideo: 500, bundle3x: 1500, monthly: 2500 },

      setApiKey: (key) => set({ apiKey: key }),
      setHiggsfieldKeys: (key, secret) => set({ higgsfieldKey: key, higgsfieldSecret: secret }),
      addVideoGeneration: (gen) => set((s) => ({
        videoGenerations: [{ ...gen, id: Date.now() }, ...s.videoGenerations].slice(0, 50),
      })),
      updateVideoGeneration: (id, updates) => set((s) => ({
        videoGenerations: s.videoGenerations.map(g => g.id === id ? { ...g, ...updates } : g),
      })),
      setOnboarded: (v) => set({ onboarded: v }),
      setProfile: (data) => set(data),
      setActiveTab: (tab) => set({ activeTab: tab }),
      updateMetrics: (updates) => set((s) => ({ metrics: { ...s.metrics, ...updates } })),
      addScript: (script) => set((s) => ({
        generatedScripts: [script, ...s.generatedScripts].slice(0, 20),
        metrics: { ...s.metrics, scriptsGenerated: s.metrics.scriptsGenerated + 1 },
      })),
      clearScripts: () => set({ generatedScripts: [] }),
      updateProspect: (id, updates) => set((s) => ({
        brandProspects: s.brandProspects.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      addProspect: (prospect) => set((s) => ({
        brandProspects: [...s.brandProspects, { ...prospect, id: Date.now() }],
      })),
      addMessage: (msg) => set((s) => ({
        chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }],
      })),
      clearChat: () => set({ chatHistory: [] }),
      addLearning: (learning) => set((s) => ({
        learnings: [{ ...learning, id: Date.now(), timestamp: Date.now() }, ...s.learnings].slice(0, 20),
      })),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      markDayComplete: (day) => set((s) => ({ completedDays: [...new Set([...s.completedDays, day])] })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })),
      updateRateCard: (updates) => set((s) => ({ rateCard: { ...s.rateCard, ...updates } })),
    }),
    { name: 'zyana-agent-v1' }
  )
)
