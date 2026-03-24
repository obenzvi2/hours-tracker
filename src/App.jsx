import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import TrackerPage from './pages/TrackerPage'

function AppInner() {
  const { session } = useAuth()

  // Still loading auth state
  if (session === undefined) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#f0f4fb', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16
      }}>
        <div className="spinner" />
        <div style={{ fontSize: '.9rem', color: '#888' }}>Loading…</div>
      </div>
    )
  }

  if (!session) return <LoginPage />
  return <TrackerPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
