import React, { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

const RECUPERATION_DAY_RATE = 418

function parseIsraeliDate(str) {
  if (!str || str.length < 8) return null
  const p = str.split('/')
  if (p.length !== 3) return null
  const d = parseInt(p[0]), m = parseInt(p[1]) - 1, y = parseInt(p[2])
  if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900) return null
  return new Date(y, m, d)
}

function calcSeniority(startStr) {
  const start = parseIsraeliDate(startStr)
  if (!start) return null
  const today = new Date()
  if (start > today) return null
  let years = today.getFullYear() - start.getFullYear()
  let months = today.getMonth() - start.getMonth()
  if (today.getDate() < start.getDate()) months--
  if (months < 0) { years--; months += 12 }
  if (years < 0) return null
  return { years, months, totalMonths: years * 12 + months }
}

function getRecuperationDays(years) {
  if (years >= 19) return 10; if (years >= 15) return 9
  if (years >= 10) return 8;  if (years >= 3)  return 7
  if (years >= 1)  return 6;  return 5
}

function getVacationDays(years) {
  if (years >= 6) return 21; if (years >= 5) return 18
  if (years >= 4) return 16; return 14
}

function fmtShekel(n) { return '₪' + Math.round(n).toLocaleString('en-IL') }
function fmtDD(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function calcHoursFromEntry(entry) {
  if (!entry.start || !entry.end) return null
  const [sh, sm] = entry.start.split(':').map(Number)
  const [eh, em] = entry.end.split(':').map(Number)
  const h = (eh * 60 + em - sh * 60 - sm) / 60
  return h > 0 ? h : null
}

export default function BenefitsModal({ settings, onBack }) {
  const sen = calcSeniority(settings.workerStartDate)

  // ── Pension: load last 12 months ──────────────────────
  const [pensionLoading, setPensionLoading] = useState(true)
  const [avgDailyHours, setAvgDailyHours]   = useState(null)
  const [monthsWithData, setMonthsWithData] = useState(0)

  useEffect(() => {
    async function loadLast12Months() {
      const now  = new Date()
      const keys = []
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        keys.push(`${d.getFullYear()}_${d.getMonth()}`)
      }
      const { data } = await sb.from('month_hours').select('days').in('month_key', keys)
      let totalHours = 0, totalDays = 0, monthsFound = 0
      for (const row of (data || [])) {
        let hadDay = false
        for (const entry of Object.values(row.days || {})) {
          const h = calcHoursFromEntry(entry)
          if (h !== null) { totalHours += h; totalDays++; hadDay = true }
        }
        if (hadDay) monthsFound++
      }
      if (totalDays > 0) setAvgDailyHours(totalHours / totalDays)
      setMonthsWithData(monthsFound)
      setPensionLoading(false)
    }
    loadLast12Months()
  }, [])

  // Seniority section
  let seniorityContent
  if (!sen) {
    seniorityContent = <p className="no-startdate">Start date not set. Please add it in ⚙️ Settings → Employee Details.</p>
  } else {
    seniorityContent = (
      <>
        <div className="seniority-display">
          <div>
            <div className="seniority-num">{sen.years}</div>
            <div className="seniority-label">Years</div>
          </div>
          <div className="seniority-divider" />
          <div>
            <div className="seniority-num">{sen.months}</div>
            <div className="seniority-label">Months</div>
          </div>
          <div className="seniority-divider" />
          <div>
            <div className="seniority-num">{sen.totalMonths}</div>
            <div className="seniority-label">Total months</div>
          </div>
        </div>
        <p style={{ fontSize: '.8rem', color: '#999', marginTop: 10 }}>
          Start date: {settings.workerStartDate} &nbsp;|&nbsp; As of today: {new Date().toLocaleDateString('en-GB')}
        </p>
      </>
    )
  }

  // Recuperation section
  let recuperationContent
  if (!sen) {
    recuperationContent = <p className="no-startdate">Requires start date in Settings.</p>
  } else {
    const start          = parseIsraeliDate(settings.workerStartDate)
    const today          = new Date()
    const currentYearNum = sen.years + 1
    const yearPeriodStart = sen.years === 0 ? start : new Date(start.getFullYear() + sen.years, start.getMonth(), start.getDate())
    const yearPeriodEnd   = new Date(start.getFullYear() + sen.years + 1, start.getMonth(), start.getDate())
    const daysEntitled    = getRecuperationDays(sen.years)
    let monthsElapsed     = (today.getFullYear() - yearPeriodStart.getFullYear()) * 12 + (today.getMonth() - yearPeriodStart.getMonth())
    if (today.getDate() < yearPeriodStart.getDate()) monthsElapsed--
    monthsElapsed = Math.max(0, Math.min(12, monthsElapsed))
    const empPct         = settings.employmentPct || 100
    const empFactor      = empPct / 100
    const annualTotal    = daysEntitled * RECUPERATION_DAY_RATE * empFactor
    const monthlyAccrual = annualTotal / 12
    const accruedSoFar   = monthlyAccrual * monthsElapsed

    recuperationContent = (
      <>
        <div style={{ background: '#eef4ff', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: '.83rem', color: '#333', lineHeight: 1.6 }}>
          <strong>Year {currentYearNum} of employment</strong> &nbsp;|&nbsp;
          {fmtDD(yearPeriodStart)} – {fmtDD(yearPeriodEnd)} &nbsp;|&nbsp;
          <strong>{monthsElapsed}</strong> / 12 months elapsed
        </div>
        <div className="benefit-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Recuperation Days (Year {currentYearNum})</span>
            <span className="benefit-stat-value">{daysEntitled}</span>
            <span className="benefit-stat-unit">days per full year</span>
          </div>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Employment Scope</span>
            <span className="benefit-stat-value">{empPct}%</span>
            <span className="benefit-stat-unit">set in ⚙️ Settings</span>
          </div>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Monthly Accrual</span>
            <span className="benefit-stat-value">{fmtShekel(monthlyAccrual)}</span>
            <span className="benefit-stat-unit">₪ / month</span>
          </div>
          <div className="benefit-stat highlight">
            <span className="benefit-stat-label">Accrued to Date</span>
            <span className="benefit-stat-value">{fmtShekel(accruedSoFar)}</span>
            <span className="benefit-stat-unit">{monthsElapsed} months × {fmtShekel(monthlyAccrual)}</span>
          </div>
        </div>
        <div className="benefit-stat" style={{ marginBottom: 14 }}>
          <span className="benefit-stat-label">Annual Total ({daysEntitled} days × ₪{RECUPERATION_DAY_RATE} × {empPct}%)</span>
          <span className="benefit-stat-value">{fmtShekel(annualTotal)}</span>
          <span className="benefit-stat-unit">₪ per full year</span>
        </div>
        <div className="benefit-note">
          Recuperation pay is paid once a year, typically around July–August. Rate: ₪{RECUPERATION_DAY_RATE}/day (private sector, 2026) for 100% employment scope.
          Days: 5 (year 1) → 6 (years 2–3) → 7 (years 4–10) → 8 (years 11–15) → 9 (years 16–19) → 10 (year 20+).<br />
          <em>To update employment scope: ⚙️ Settings → Salary Settings → Employment Scope.</em>
        </div>
      </>
    )
  }

  // Vacation section
  let vacationContent
  if (!sen) {
    vacationContent = <p className="no-startdate">Requires start date in Settings.</p>
  } else {
    const vacDays         = getVacationDays(sen.years)
    const dailyRate       = settings.vacationDayRate || 350
    const annualVacValue  = vacDays * dailyRate
    const monthlyVacValue = annualVacValue / 12

    vacationContent = (
      <>
        <div className="benefit-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Vacation Days (Year {sen.years + 1})</span>
            <span className="benefit-stat-value">{vacDays}</span>
            <span className="benefit-stat-unit">days per year</span>
          </div>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Daily Rate</span>
            <span className="benefit-stat-value">{fmtShekel(dailyRate)}</span>
            <span className="benefit-stat-unit">set in ⚙️ Settings</span>
          </div>
          <div className="benefit-stat">
            <span className="benefit-stat-label">Monthly Accrual</span>
            <span className="benefit-stat-value">{fmtShekel(monthlyVacValue)}</span>
            <span className="benefit-stat-unit">₪ / month</span>
          </div>
          <div className="benefit-stat highlight">
            <span className="benefit-stat-label">Annual Value</span>
            <span className="benefit-stat-value">{fmtShekel(annualVacValue)}</span>
            <span className="benefit-stat-unit">{vacDays} days × ₪{dailyRate}</span>
          </div>
        </div>
        <div className="benefit-note">
          Annual leave by law (Annual Leave Law): 14 days (years 1–3) → 16 days (year 4) → 18 days (year 5) → 21 days (year 6+).<br />
          <em>To update daily rate: ⚙️ Settings → Salary Settings → Vacation Day Rate.</em>
        </div>
      </>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="benefits-header">
        <div>
          <div className="benefits-title">📊 Social Benefits</div>
          <div className="benefits-subtitle">Calculated per Israeli labor law for domestic workers</div>
        </div>
        <button className="btn-back" onClick={onBack}>← Back</button>
      </div>

      <div className="benefit-card">
        <div className="benefit-card-title">📅 Seniority</div>
        {seniorityContent}
      </div>

      <div className="benefit-card">
        <div className="benefit-card-title">🌴 Recuperation Pay (דמי הבראה)</div>
        {recuperationContent}
      </div>

      <div className="benefit-card">
        <div className="benefit-card-title">🏖️ Annual Vacation</div>
        {vacationContent}
      </div>

      <div className="benefit-card">
        <div className="benefit-card-title">🏦 Pension (פנסיה)</div>
        {pensionLoading ? (
          <p className="no-startdate">Calculating…</p>
        ) : avgDailyHours === null ? (
          <p className="no-startdate">No work hours found in the last 12 months. Enter hours in the tracker first.</p>
        ) : (() => {
          const hourlyRate      = settings.hourlyRate || 70
          const grossSalary     = Math.round(avgDailyHours * 6 * 4.33 * hourlyRate)
          const empContrib      = Math.round(grossSalary * 0.065)   // employer 6.5%
          const empSeverance    = Math.round(grossSalary * 0.06)    // employer severance 6%
          const employerTotal   = Math.round(grossSalary * 0.125)   // employer total 12.5%
          const employeeDeduct  = Math.round(grossSalary * 0.06)    // employee 6%
          const pensionTotal    = Math.round(grossSalary * 0.185)   // grand total 18.5%
          return (
            <>
              <div style={{ background: '#eef4ff', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: '.83rem', color: '#333', lineHeight: 1.6 }}>
                <strong>Based on {monthsWithData} months of data</strong> &nbsp;|&nbsp;
                Avg daily hours: <strong>{avgDailyHours.toFixed(2)}</strong> &nbsp;|&nbsp;
                Estimated gross salary: <strong>{fmtShekel(grossSalary)}</strong> / month
              </div>
              <div style={{ fontSize: '.75rem', color: '#888', marginBottom: 10 }}>
                Formula: {avgDailyHours.toFixed(2)} hrs/day × 6 days × 4.33 weeks × ₪{hourlyRate}/hr = {fmtShekel(grossSalary)}
              </div>

              {/* Employer breakdown */}
              <div className="pension-section-label">Employer Contributions</div>
              <div className="benefit-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="benefit-stat">
                  <span className="benefit-stat-label">Employer Contribution</span>
                  <span className="benefit-stat-value">{fmtShekel(empContrib)}</span>
                  <span className="benefit-stat-unit">6.5% of gross</span>
                </div>
                <div className="benefit-stat">
                  <span className="benefit-stat-label">Severance Fund</span>
                  <span className="benefit-stat-value">{fmtShekel(empSeverance)}</span>
                  <span className="benefit-stat-unit">6% of gross</span>
                </div>
                <div className="benefit-stat highlight">
                  <span className="benefit-stat-label">Employer Total</span>
                  <span className="benefit-stat-value">{fmtShekel(employerTotal)}</span>
                  <span className="benefit-stat-unit">12.5% of gross</span>
                </div>
              </div>

              {/* Employee + Grand total */}
              <div className="pension-section-label" style={{ marginTop: 6 }}>Employee Deduction & Grand Total</div>
              <div className="benefit-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="benefit-stat">
                  <span className="benefit-stat-label">Employee Deduction</span>
                  <span className="benefit-stat-value">{fmtShekel(employeeDeduct)}</span>
                  <span className="benefit-stat-unit">6% of gross (from salary)</span>
                </div>
                <div className="benefit-stat highlight">
                  <span className="benefit-stat-label">Total to Pension Fund</span>
                  <span className="benefit-stat-value">{fmtShekel(pensionTotal)}</span>
                  <span className="benefit-stat-unit">18.5% of gross / month</span>
                </div>
              </div>

              <div className="benefit-note">
                Pension rates (domestic workers, Israel 2026): Employer — 6.5% contribution + 6% severance = 12.5%. Employee — 6% deduction.<br />
                <em>Gross salary estimated from avg daily hours × 6 days/week × 4.33 weeks/month × hourly rate (set in ⚙️ Settings).</em>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
