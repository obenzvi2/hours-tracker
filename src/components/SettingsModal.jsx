import React, { useState, useEffect } from 'react'

function autoFormatDate(raw) {
  let v = raw.replace(/[^0-9]/g, '')
  if (v.length > 8) v = v.slice(0, 8)
  if (v.length >= 5)      v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4)
  else if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2)
  return v
}

export default function SettingsModal({ settings, onSave, onBack }) {
  const [form, setForm] = useState({ ...settings })

  useEffect(() => {
    setForm({ ...settings })
  }, [settings])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleDateInput(key, raw) {
    set(key, autoFormatDate(raw))
  }

  function handleSave() {
    const DEFAULT_SETTINGS = {
      hourlyRate: 70, travelAllowance: 315, employmentPct: 100,
      vacationDayRate: 350, employerPensionPct: 12.5, employeePensionPct: 6
    }
    const rate   = parseFloat(form.hourlyRate)
    const travel = parseFloat(form.travelAllowance)
    const empPct = parseFloat(form.employmentPct)
    const vacRate= parseFloat(form.vacationDayRate)
    const erpPct = parseFloat(form.employerPensionPct)
    const eePct  = parseFloat(form.employeePensionPct)

    const saved = {
      empFullName:    (form.empFullName    || '').trim(),
      empId:          (form.empId          || '').trim(),
      empAddress:     (form.empAddress     || '').trim(),
      empPhone:       (form.empPhone       || '').trim(),
      empEmail:       (form.empEmail       || '').trim(),
      workerFullName: (form.workerFullName || '').trim(),
      workerId:       (form.workerId       || '').trim(),
      workerAddress:  (form.workerAddress  || '').trim(),
      workerPhone:    (form.workerPhone    || '').trim(),
      workerEmail:    (form.workerEmail    || '').trim(),
      workerStartDate:(form.workerStartDate|| '').trim(),
      workerDob:      (form.workerDob      || '').trim(),
      hourlyRate:      (!isNaN(rate)    && rate    > 0)                   ? rate    : DEFAULT_SETTINGS.hourlyRate,
      travelAllowance: (!isNaN(travel)  && travel  >= 0)                  ? travel  : DEFAULT_SETTINGS.travelAllowance,
      employmentPct:   (!isNaN(empPct)  && empPct  >= 1 && empPct <= 100) ? empPct  : DEFAULT_SETTINGS.employmentPct,
      vacationDayRate: (!isNaN(vacRate) && vacRate > 0)                   ? vacRate : DEFAULT_SETTINGS.vacationDayRate,
      employerPensionPct: (!isNaN(erpPct) && erpPct >= 0 && erpPct <= 100) ? erpPct : DEFAULT_SETTINGS.employerPensionPct,
      employeePensionPct: (!isNaN(eePct)  && eePct  >= 0 && eePct  <= 100) ? eePct  : DEFAULT_SETTINGS.employeePensionPct,
    }
    onSave(saved)
  }

  return (
    <div className="page-wrapper">
      <div className="settings-header">
        <div className="settings-title">⚙️ Settings</div>
        <button className="btn-back" onClick={onBack}>← Back</button>
      </div>

      {/* Employer Details */}
      <div className="settings-section">
        <div className="settings-section-title">🏢 Employer Details</div>
        <div className="settings-grid">
          <div className="settings-field">
            <label>Full Name</label>
            <input type="text" value={form.empFullName || ''} placeholder="Employer full name" onChange={e => set('empFullName', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>ID Number</label>
            <input type="text" value={form.empId || ''} placeholder="000000000" onChange={e => set('empId', e.target.value)} />
          </div>
          <div className="settings-field full-width">
            <label>Address</label>
            <input type="text" value={form.empAddress || ''} placeholder="Street, City" onChange={e => set('empAddress', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Phone</label>
            <input type="text" value={form.empPhone || ''} placeholder="05X-XXXXXXX" onChange={e => set('empPhone', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={form.empEmail || ''} placeholder="email@example.com" onChange={e => set('empEmail', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="settings-section">
        <div className="settings-section-title">👤 Employee Details</div>
        <div className="settings-grid">
          <div className="settings-field">
            <label>Full Name</label>
            <input type="text" value={form.workerFullName || ''} placeholder="Employee full name" onChange={e => set('workerFullName', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>ID Number</label>
            <input type="text" value={form.workerId || ''} placeholder="000000000" onChange={e => set('workerId', e.target.value)} />
          </div>
          <div className="settings-field full-width">
            <label>Address</label>
            <input type="text" value={form.workerAddress || ''} placeholder="Street, City" onChange={e => set('workerAddress', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Phone</label>
            <input type="text" value={form.workerPhone || ''} placeholder="05X-XXXXXXX" onChange={e => set('workerPhone', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={form.workerEmail || ''} placeholder="email@example.com" onChange={e => set('workerEmail', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Start Date</label>
            <input
              type="text"
              value={form.workerStartDate || ''}
              placeholder="DD/MM/YYYY"
              onChange={e => handleDateInput('workerStartDate', e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label>Date of Birth</label>
            <input
              type="text"
              value={form.workerDob || ''}
              placeholder="DD/MM/YYYY"
              onChange={e => handleDateInput('workerDob', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Salary Settings */}
      <div className="settings-section">
        <div className="settings-section-title">💰 Salary Settings</div>
        <div className="settings-grid">
          <div className="settings-field">
            <label>Hourly Rate (₪)</label>
            <input type="number" value={form.hourlyRate ?? ''} min={1} max={9999} placeholder="70" onChange={e => set('hourlyRate', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Monthly Travel Allowance (₪)</label>
            <input type="number" value={form.travelAllowance ?? ''} min={0} max={9999} placeholder="315" onChange={e => set('travelAllowance', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Employment Scope (%)</label>
            <input type="number" value={form.employmentPct ?? ''} min={1} max={100} placeholder="100" onChange={e => set('employmentPct', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Vacation Day Rate (₪)</label>
            <input type="number" value={form.vacationDayRate ?? ''} min={1} max={9999} placeholder="350" onChange={e => set('vacationDayRate', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Employer Pension Contribution (%)</label>
            <input type="number" value={form.employerPensionPct ?? ''} min={0} max={100} step={0.1} placeholder="12.5" onChange={e => set('employerPensionPct', e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Employee Pension Deduction (%)</label>
            <input type="number" value={form.employeePensionPct ?? ''} min={0} max={100} step={0.1} placeholder="6" onChange={e => set('employeePensionPct', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Save buttons */}
      <div className="settings-section">
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-save-settings" onClick={handleSave}>✓ Save Settings</button>
          <button
            className="btn-save-settings"
            onClick={onBack}
            style={{ background: 'rgba(26,95,180,.15)', color: '#1a5fb4', boxShadow: 'none', border: '2px solid #1a5fb4' }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
