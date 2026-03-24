import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const passwordRef = useRef(null)

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error: err } = await signIn(email.trim(), password)
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : err.message
      )
      setLoading(false)
    }
    // On success, AuthContext updates session → App renders TrackerPage
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">📋</div>
          <div className="login-logo-title">Work Hours Tracker</div>
          <div className="login-logo-sub">Sign in to access your data</div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="login-field">
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && passwordRef.current?.focus()}
          />
          <input
            ref={passwordRef}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="btn-login" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
