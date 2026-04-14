import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'

import Login    from './pages/Login.jsx'
import Signup   from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Scripts  from './pages/Scripts.jsx'
import Chat     from './pages/Chat.jsx'
import Outreach from './pages/Outreach.jsx'
import Credits  from './pages/Credits.jsx'
import Settings from './pages/Settings.jsx'

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
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

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
