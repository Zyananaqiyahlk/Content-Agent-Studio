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
      completedDays: [1, 2, 3, 4, 5, 6],
      audioEnabled: false,
      rateCard: { singleVideo: 500, bundle3x: 1500, monthly: 2500 },
      setApiKey: (key) => set({ apiKey: key }),
      setHiggsfieldKeys: (key, secret) => set({ higgsfieldKey: key, higgsfieldSecret: secret }),
      addVideoGeneration: (gen) => set((s) => ({ videoGenerations: [{ ...gen, id: Date.now() }, ...s.videoGenerations].slice(0, 50) })),
      updateVideoGeneration: (id, updates) => set((s) => ({ videoGenerations: s.videoGenerations.map(g => g.id === id ? { ...g, ...updates } : g) })),
      setOnboarded: (v) => set({ onboarded: v }),
      setProfile: (data) => set(data),
      setActiveTab: (tab) => set({ activeTab: tab }),
      updateMetrics: (updates) => set((s) => ({ metrics: { ...s.metrics, ...updates } })),
      addScript: (script) => set((s) => ({ generatedScripts: [script, ...s.generatedScripts].slice(0, 20), metrics: { ...s.metrics, scriptsGenerated: s.metrics.scriptsGenerated + 1 } })),
      clearScripts: () => set({ generatedScripts: [] }),
      updateProspect: (id, updates) => set((s) => ({ brandProspects: s.brandProspects.map(p => p.id === id ? { ...p, ...updates } : p) })),
      addProspect: (prospect) => set((s) => ({ brandProspects: [...s.brandProspects, { ...prospect, id: Date.now() }] })),
      addMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }] })),
      clearChat: () => set({ chatHistory: [] }),
      addLearning: (learning) => set((s) => ({ learnings: [{ ...learning, id: Date.now(), timestamp: Date.now() }, ...s.learnings].slice(0, 20) })),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      markDayComplete: (day) => set((s) => ({ completedDays: [...new Set([...s.completedDays, day])] })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })),
      updateRateCard: (updates) => set((s) => ({ rateCard: { ...s.rateCard, ...updates } })),
    }),
    { name: 'zyana-agent-v1' }
  )
)
