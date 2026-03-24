import React from 'react'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Header({ year, month, navLoading, onPrev, onNext, onPrint, onOpenSettings, onOpenBenefits, onLogout, userEmail }) {
  return (
    <div className="app-header">
      <div className="header-top">
        <div className="app-title">📋 Work Hours Tracker</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span id="userEmail" style={{ fontSize: '.8rem', opacity: .75, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userEmail}
          </span>
          <button className="btn-print" onClick={onPrint}>🖨️ Print</button>
          <button className="btn-benefits" onClick={onOpenBenefits}>📊 Benefits</button>
          <button className="btn-settings" onClick={onOpenSettings}>⚙️ Settings</button>
          <button className="btn-settings" onClick={onLogout}>🚪 Log Out</button>
        </div>
      </div>
      <div className="month-nav">
        <button onClick={onPrev} disabled={navLoading} title="Previous month">‹</button>
        <div className="month-title" style={{ opacity: navLoading ? 0.4 : 1 }}>
          {MONTHS_EN[month]} {year}
        </div>
        <button onClick={onNext} disabled={navLoading} title="Next month">›</button>
      </div>
    </div>
  )
}
