import React from 'react'

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

function MetricCard({ label, value, sub, highlight }) {
  return (
    <div className={`metric-card${highlight ? ' metric-card-hl' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export default function BenefitsModal({ settings, onBack }) {
  const sen = calcSeniority(settings.workerStartDate)

  // Seniority
  let seniorityContent
  if (!sen) {
    seniorityContent = <p className="no-startdate">Start date not set. Please add it in ⚙️ Settings → Employee Details.</p>
  } else {
    seniorityContent = (
      <div className="metrics-row metrics-3">
        <MetricCard label="Years" value={sen.years} sub={`since ${settings.workerStartDate}`} />
        <MetricCard label="Months" value={sen.months} sub="this year" />
        <MetricCard label="Total Months" value={sen.totalMonths} highlight />
      </div>
    )
  }

  // Recuperation
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
        <div className="benefit-period-bar">
          Year {currentYearNum} · {fmtDD(yearPeriodStart)} – {fmtDD(yearPeriodEnd)} · {monthsElapsed}/12 months elapsed
        </div>
        <div className="metrics-row metrics-4">
          <MetricCard label="Days" value={daysEntitled} sub={`year ${currentYearNum}`} />
          <MetricCard label="Scope" value={`${empPct}%`} sub={`×₪${RECUPERATION_DAY_RATE}/day`} />
          <MetricCard label="Monthly Accrual" value={fmtShekel(monthlyAccrual)} sub="per month" />
          <MetricCard label="Accrued to Date" value={fmtShekel(accruedSoFar)} sub={`${monthsElapsed} months`} highlight />
        </div>
        <div className="benefit-note">
          Paid once/year (July–Aug). Rate: ₪{RECUPERATION_DAY_RATE}/day · Annual: {fmtShekel(annualTotal)} ·
          Days: 5→6 (yr1)→7 (yr4)→8 (yr11)→9 (yr16)→10 (yr20+)
        </div>
      </>
    )
  }

  // Vacation
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
        <div className="metrics-row metrics-4">
          <MetricCard label="Days" value={vacDays} sub={`year ${sen.years + 1}`} />
          <MetricCard label="Daily Rate" value={fmtShekel(dailyRate)} sub="from Settings" />
          <MetricCard label="Monthly Accrual" value={fmtShekel(monthlyVacValue)} sub="per month" />
          <MetricCard label="Annual Value" value={fmtShekel(annualVacValue)} sub={`${vacDays} days × ₪${dailyRate}`} highlight />
        </div>
        <div className="benefit-note">
          By law: 14 days (yr 1–3) → 16 (yr 4) → 18 (yr 5) → 21 (yr 6+) · Update daily rate in ⚙️ Settings
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
        <div className="benefit-card-title">🌴 Recuperation Pay</div>
        {recuperationContent}
      </div>

      <div className="benefit-card">
        <div className="benefit-card-title">🏖️ Annual Vacation</div>
        {vacationContent}
      </div>
    </div>
  )
}
