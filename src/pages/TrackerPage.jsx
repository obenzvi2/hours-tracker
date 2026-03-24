import React, { useState, useEffect, useCallback, useRef } from 'react'
import { sb } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import MonthGrid from '../components/MonthGrid'
import SettingsModal from '../components/SettingsModal'
import BenefitsModal from '../components/BenefitsModal'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

const DEFAULT_SETTINGS = {
  empFullName:'', empId:'', empAddress:'', empPhone:'', empEmail:'',
  workerFullName:'', workerId:'', workerAddress:'', workerPhone:'', workerEmail:'',
  workerStartDate:'', workerDob:'',
  hourlyRate:70, travelAllowance:315, employmentPct:100,
  vacationDayRate:350, employerPensionPct:12.5, employeePensionPct:6
}

export default function TrackerPage() {
  const { session, signOut } = useAuth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [settings,       setSettings]       = useState({ ...DEFAULT_SETTINGS })
  const [monthData,      setMonthData]       = useState({})
  const [pensionChecked, setPensionChecked]  = useState(true)
  const [loading,        setLoading]         = useState(true)
  const [navLoading,     setNavLoading]      = useState(false)
  const [view,           setView]            = useState('main') // 'main' | 'settings' | 'benefits'
  const [showSaved,      setShowSaved]       = useState(false)

  // In-memory cache: key "YYYY_M" → { days, pensionChecked }
  const monthCache = useRef({})

  // Debounce refs
  const saveDebounceRef = useRef(null)
  const savePendingRef  = useRef(false)
  const saveFlashTimer  = useRef(null)

  // Track current year/month in refs so async functions see latest values
  const yearRef  = useRef(year)
  const monthRef = useRef(month)
  useEffect(() => { yearRef.current  = year  }, [year])
  useEffect(() => { monthRef.current = month }, [month])

  // ── Flash saved ────────────────────────────────────────
  function flashSaved() {
    setShowSaved(true)
    clearTimeout(saveFlashTimer.current)
    saveFlashTimer.current = setTimeout(() => setShowSaved(false), 1800)
  }

  // ── Supabase helpers ───────────────────────────────────
  async function loadSettingsFromDB() {
    const { data, error } = await sb
      .from('user_settings')
      .select('settings')
      .maybeSingle()
    if (error) { console.warn('loadSettings:', error); return }
    setSettings(data ? { ...DEFAULT_SETTINGS, ...data.settings } : { ...DEFAULT_SETTINGS })
  }

  async function saveSettingsToDB(s) {
    const { error } = await sb
      .from('user_settings')
      .upsert({ user_id: userId, settings: s }, { onConflict: 'user_id' })
    if (error) console.warn('saveSettings:', error)
  }

  async function loadMonthFromDB(y, m) {
    const key = `${y}_${m}`
    if (monthCache.current[key]) {
      const cached = monthCache.current[key]
      setMonthData(cached.days)
      setPensionChecked(cached.pensionChecked)
      return
    }
    const { data, error } = await sb
      .from('month_hours')
      .select('days, pension_checked')
      .eq('month_key', key)
      .maybeSingle()
    if (error) console.warn('loadMonth:', error)
    const days = data ? (data.days || {}) : {}
    const pc   = data ? data.pension_checked !== false : true
    monthCache.current[key] = { days, pensionChecked: pc }
    setMonthData(days)
    setPensionChecked(pc)
  }

  async function flushMonthSave(y, m, data, pc) {
    if (!savePendingRef.current) return
    clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = null
    savePendingRef.current  = false
    const key = `${y}_${m}`
    const { error } = await sb.from('month_hours').upsert({
      user_id:         userId,
      month_key:       key,
      days:            data,
      pension_checked: pc,
      updated_at:      new Date().toISOString()
    }, { onConflict: 'user_id,month_key' })
    if (error) console.warn('flushSave:', error)
  }

  function scheduleMonthSave(y, m, data, pc) {
    savePendingRef.current = true
    const key = `${y}_${m}`
    monthCache.current[key] = { days: data, pensionChecked: pc }
    clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(async () => {
      savePendingRef.current = false
      const { error } = await sb.from('month_hours').upsert({
        user_id:         userId,
        month_key:       key,
        days:            data,
        pension_checked: pc,
        updated_at:      new Date().toISOString()
      }, { onConflict: 'user_id,month_key' })
      if (error) console.warn('saveMonth:', error)
      else flashSaved()
    }, 600)
  }

  // ── Initial load ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      setLoading(true)
      try {
        await Promise.all([loadSettingsFromDB(), loadMonthFromDB(year, month)])
      } catch(e) { console.warn('init:', e) }
      setLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // ── Entry change handler ───────────────────────────────
  const handleEntryChange = useCallback((day, field, value) => {
    setMonthData(prev => {
      const updated = { ...prev, [String(day)]: { ...(prev[String(day)] || {}), [field]: value } }
      scheduleMonthSave(yearRef.current, monthRef.current, updated, pensionChecked)
      return updated
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pensionChecked])

  // ── Pay change handler ─────────────────────────────────
  const handlePayChange = useCallback((day, val, autoStr) => {
    setMonthData(prev => {
      const dayKey = String(day)
      const entry  = { ...(prev[dayKey] || {}) }
      if (val === '' || val === autoStr) {
        delete entry.payOverride
      } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
        entry.payOverride = val
      } else {
        return prev // invalid — no change
      }
      const updated = { ...prev, [dayKey]: entry }
      scheduleMonthSave(yearRef.current, monthRef.current, updated, pensionChecked)
      return updated
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pensionChecked])

  // ── Pension checkbox ───────────────────────────────────
  const handlePensionChange = useCallback((checked) => {
    setPensionChecked(checked)
    scheduleMonthSave(yearRef.current, monthRef.current, monthData, checked)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthData])

  // ── Month navigation ───────────────────────────────────
  async function navigateMonth(delta) {
    // Flush pending save for current month before navigating
    await flushMonthSave(year, month, monthData, pensionChecked)

    let newMonth = month + delta
    let newYear  = year
    if (newMonth < 0)  { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0;  newYear++ }

    setNavLoading(true)
    setYear(newYear)
    setMonth(newMonth)

    // Update refs immediately so scheduleMonthSave uses correct keys
    yearRef.current  = newYear
    monthRef.current = newMonth

    await loadMonthFromDB(newYear, newMonth)
    setNavLoading(false)
  }

  // ── Settings save ──────────────────────────────────────
  async function handleSaveSettings(newSettings) {
    setSettings(newSettings)
    await saveSettingsToDB(newSettings)
    flashSaved()
    setView('main')
  }

  // ── Logout ─────────────────────────────────────────────
  async function handleLogout() {
    await flushMonthSave(year, month, monthData, pensionChecked)
    await signOut()
  }

  // ── Print ──────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── Render ─────────────────────────────────────────────
  if (loading) {
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

  return (
    <>
      {/* Save indicator */}
      <div className={`save-indicator${showSaved ? ' show' : ''}`}>✓ Saved</div>

      {view === 'settings' && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onBack={() => setView('main')}
        />
      )}

      {view === 'benefits' && (
        <BenefitsModal
          settings={settings}
          onBack={() => setView('main')}
        />
      )}

      {view === 'main' && (
        <div className="page-wrapper">
          <Header
            year={year}
            month={month}
            navLoading={navLoading}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
            onPrint={handlePrint}
            onOpenSettings={() => setView('settings')}
            onOpenBenefits={() => setView('benefits')}
            onLogout={handleLogout}
            userEmail={userEmail}
          />

          <MonthGrid
            key={`${year}_${month}`}
            year={year}
            month={month}
            monthData={monthData}
            settings={settings}
            pensionChecked={pensionChecked}
            onEntryChange={handleEntryChange}
            onPayChange={handlePayChange}
            onPensionChange={handlePensionChange}
          />

          <div className="app-footer">Data securely stored in the cloud ☁️</div>
        </div>
      )}
    </>
  )
}
