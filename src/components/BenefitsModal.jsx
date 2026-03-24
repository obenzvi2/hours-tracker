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

function BenefitCard({ title, period, cols, note }) {
  return (
    <div className="bn-card">
      <div className="bn-card-head">
        <span className="bn-card-title">{title}</span>
        {period && <span className="bn-card-period">{period}</span>}
      </div>
      <div className="bn-cols">
        {cols.map((col, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="bn-divider" />}
            <div className="bn-col">
              <div className="bn-col-label">{col.label}</div>
              <div className={`bn-col-value${col.accent ? ' bn-accent' : ''}`}>{col.value}</div>
              {col.sub && <div className="bn-col-sub">{col.sub}</div>}
            </div>
          </React.Fragment>
        ))}
      </div>
      {note && <div className="bn-note">{note}</div>}
    </div>
  )
}

export default function BenefitsModal({ settings, onBack }) {
  const sen = calcSeniority(settings.workerStartDate)

  return (
    <div className="page-wrapper">
      <div className="bn-header">
        <span className="bn-header-title">📊 Social Benefits</span>
        <button className="btn-back" onClick={onBack}>← Back</button>
      </div>

      {/* Seniority */}
      {!sen ? (
        <div className="bn-card">
          <div className="bn-card-head"><span className="bn-card-title">📅 Seniority</span></div>
          <p className="bn-empty">Start date not set — add it in ⚙️ Settings → Employee Details.</p>
        </div>
      ) : (
        <BenefitCard
          title="📅 Seniority"
          cols={[
            { label: 'Years',        value: sen.years },
            { label: 'Months',       value: sen.months },
            { label: 'Total Months', value: sen.totalMonths, accent: true },
            { label: 'Start Date',   value: settings.workerStartDate, sub: 'DD/MM/YYYY' },
          ]}
        />
      )}

      {/* Recuperation */}
      {!sen ? (
        <div className="bn-card">
          <div className="bn-card-head"><span className="bn-card-title">🌴 Recuperation Pay</span></div>
          <p className="bn-empty">Requires start date in Settings.</p>
        </div>
      ) : (() => {
        const start           = parseIsraeliDate(settings.workerStartDate)
        const today           = new Date()
        const currentYearNum  = sen.years + 1
        const yearPeriodStart = sen.years === 0 ? start : new Date(start.getFullYear() + sen.years, start.getMonth(), start.getDate())
        const yearPeriodEnd   = new Date(start.getFullYear() + sen.years + 1, start.getMonth(), start.getDate())
        const daysEntitled    = getRecuperationDays(sen.years)
        let monthsElapsed     = (today.getFullYear() - yearPeriodStart.getFullYear()) * 12 + (today.getMonth() - yearPeriodStart.getMonth())
        if (today.getDate() < yearPeriodStart.getDate()) monthsElapsed--
        monthsElapsed = Math.max(0, Math.min(12, monthsElapsed))
        const empPct          = settings.employmentPct || 100
        const annualTotal     = daysEntitled * RECUPERATION_DAY_RATE * (empPct / 100)
        const monthlyAccrual  = annualTotal / 12
        const accruedSoFar    = monthlyAccrual * monthsElapsed

        return (
          <BenefitCard
            title="🌴 Recuperation Pay"
            period={`Year ${currentYearNum} · ${fmtDD(yearPeriodStart)} – ${fmtDD(yearPeriodEnd)} · ${monthsElapsed}/12 months`}
            cols={[
              { label: 'Days',           value: daysEntitled,           sub: `year ${currentYearNum}` },
              { label: 'Scope',          value: `${empPct}%`,           sub: `₪${RECUPERATION_DAY_RATE}/day` },
              { label: 'Monthly Accrual',value: fmtShekel(monthlyAccrual), sub: 'per month' },
              { label: 'Accrued to Date',value: fmtShekel(accruedSoFar),   sub: `${monthsElapsed} months`, accent: true },
            ]}
            note={`Paid once/year (July–Aug). Annual total: ${fmtShekel(annualTotal)} · Days: 5 (yr1) → 6 (yr2–3) → 7 (yr4–10) → 8 (yr11–15) → 9 (yr16–19) → 10 (yr20+)`}
          />
        )
      })()}

      {/* Vacation */}
      {!sen ? (
        <div className="bn-card">
          <div className="bn-card-head"><span className="bn-card-title">🏖️ Annual Vacation</span></div>
          <p className="bn-empty">Requires start date in Settings.</p>
        </div>
      ) : (() => {
        const vacDays        = getVacationDays(sen.years)
        const dailyRate      = settings.vacationDayRate || 350
        const annualVacValue = vacDays * dailyRate
        const monthlyVacValue= annualVacValue / 12

        return (
          <BenefitCard
            title="🏖️ Annual Vacation"
            period={`Year ${sen.years + 1}`}
            cols={[
              { label: 'Days',           value: vacDays,                   sub: `year ${sen.years + 1}` },
              { label: 'Daily Rate',     value: fmtShekel(dailyRate),      sub: 'from Settings' },
              { label: 'Monthly Accrual',value: fmtShekel(monthlyVacValue),sub: 'per month' },
              { label: 'Annual Value',   value: fmtShekel(annualVacValue), sub: `${vacDays} days × ₪${dailyRate}`, accent: true },
            ]}
            note={`By law: 14 days (yr 1–3) → 16 (yr 4) → 18 (yr 5) → 21 (yr 6+) · Update daily rate in ⚙️ Settings → Salary Settings`}
          />
        )
      })()}
    </div>
  )
}
