import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { NotifProvider, useNotif } from './context/NotifContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import OnboardingModal from './components/OnboardingModal.jsx'

import Login    from './pages/Login.jsx'
import Signup   from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Scripts  from './pages/Scripts.jsx'
import Chat     from './pages/Chat.jsx'
import Outreach from './pages/Outreach.jsx'
import Credits  from './pages/Credits.jsx'
import Settings from './pages/Settings.jsx'
import Studio   from './pages/Studio.jsx'

// Smart notification triggers based on user state
function SmartNotifications() {
  const { user, credits } = useAuth()
  const { notify } = useNotif()
  const location = useLocation()
  const triggered = {}

  useEffect(() => {
    if (!user) return

    // Low credits warning
    if (credits <= 5 && credits > 0 && !triggered.lowCredits) {
      triggered.lowCredits = true
      setTimeout(() => {
        notify({
          title: '⚡ Credits running low',
          message: `You have ${credits} credits left. Top up to keep generating content.`,
          type: 'coral',
          duration: 8000,
          actions: [{ label: 'Buy Credits', value: 'buy' }],
          onAction: () => window.location.href = '/credits'
        })
      }, 2000)
    }

    // First visit to Scripts — suggest using AI
    if (location.pathname === '/scripts' && !localStorage.getItem('visited_scripts')) {
      localStorage.setItem('visited_scripts', 'true')
      setTimeout(() => {
        notify({
          title: '🎬 Script Generator tip',
          message: `Hi ${user.name?.split(' ')[0]}! Pick your format and niche first — your agent already knows you're in ${user.niche}.`,
          type: 'sage',
          duration: 7000
        })
      }, 1500)
    }

    // First visit to Outreach
    if (location.pathname === '/outreach' && !localStorage.getItem('visited_outreach')) {
      localStorage.setItem('visited_outreach', 'true')
      setTimeout(() => {
        notify({
          title: '📧 Brand Outreach tip',
          message: 'Add a brand and hit "Generate Email" — your agent writes a personalised pitch based on your niche and metrics.',
          type: 'golden',
          duration: 7000
        })
      }, 1500)
    }

    // Daily check-in reminder
    const lastCheckin = localStorage.getItem('last_checkin')
    const today = new Date().toDateString()
    if (lastCheckin !== today && location.pathname === '/dashboard') {
      localStorage.setItem('last_checkin', today)
      setTimeout(() => {
        const hour = new Date().getHours()
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
        notify({
          title: `${greeting}, ${user.name?.split(' ')[0]}! 👋`,
          message: "Your daily content tasks are ready. Let's keep the momentum going.",
          type: 'sage',
          duration: 6000
        })
      }, 1000)
    }
  }, [location.pathname, user, credits])

  return null
}

function AppShell({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const onboarded = localStorage.getItem('onboarded')
    const isNewSignup = location.state?.showOnboarding
    if (user && (!onboarded || isNewSignup)) {
      setTimeout(() => setShowOnboarding(true), 800)
    }
  }, [user, location.state])

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <SmartNotifications />
        {children}
      </main>
      {showOnboarding && (
        <OnboardingModal onComplete={(data) => {
          setShowOnboarding(false)
          localStorage.setItem('onboarded', 'true')
        }} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={
              <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>
            } />
            <Route path="/scripts" element={
              <ProtectedRoute><AppShell><Scripts /></AppShell></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><AppShell><Chat /></AppShell></ProtectedRoute>
            } />
            <Route path="/outreach" element={
              <ProtectedRoute><AppShell><Outreach /></AppShell></ProtectedRoute>
            } />
            <Route path="/credits" element={
              <ProtectedRoute><AppShell><Credits /></AppShell></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><AppShell><Settings /></AppShell></ProtectedRoute>
            } />
            <Route path="/studio" element={
              <ProtectedRoute><AppShell><Studio /></AppShell></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotifProvider>
    </AuthProvider>
  )
}
