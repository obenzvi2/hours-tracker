import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
          <img src="/favicon.png" alt="Work Hours Tracker" className="login-logo-icon" />
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
          <div className="password-wrapper">
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <button className="btn-login" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
