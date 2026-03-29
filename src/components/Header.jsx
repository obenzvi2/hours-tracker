import React from 'react'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

const NAV_ITEMS = [
  { key: 'main',     label: '📋 Work Hours' },
  { key: 'benefits', label: '📊 Benefits'   },
  { key: 'settings', label: '⚙️ Settings'   },
]

export default function Header({ view, onNavigate, year, month, navLoading, onPrev, onNext, onPrint, onLogout, userEmail }) {
  return (
    <div className="app-header">
      <div className="header-top">
        <div className="app-title">📋 Work Hours Tracker</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span id="userEmail" style={{ fontSize: '.8rem', opacity: .75, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userEmail}
          </span>
          {view === 'main' && (
            <button className="btn-print" onClick={onPrint}>🖨️ Print</button>
          )}
          <button className="btn-settings" onClick={onLogout}>🚪 Log Out</button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="header-nav">
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            className={`nav-btn${view === key ? ' nav-btn-active' : ''}`}
            onClick={() => onNavigate(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Month navigation — only on Work Hours page */}
      {view === 'main' && (
        <div className="month-nav">
          <button onClick={onPrev} disabled={navLoading} title="Previous month">‹</button>
          <div className="month-title" style={{ opacity: navLoading ? 0.4 : 1 }}>
            {MONTHS_EN[month]} {year}
          </div>
          <button onClick={onNext} disabled={navLoading} title="Next month">›</button>
        </div>
      )}
    </div>
  )
}
