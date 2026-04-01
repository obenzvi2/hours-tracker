import React, { useMemo } from 'react'
import DayRow from './DayRow'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function calcHours(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff / 60 : null
}
function fmtDecimal(h) { return h === null ? null : h.toFixed(2) }

export default function MonthGrid({
  year, month, monthData, settings, pensionChecked,
  onEntryChange, onPayChange, onPensionChange
}) {
  const totalDays = daysInMonth(year, month)

  const summary = useMemo(() => {
    let totalMinutes = 0, workedDays = 0, totalPay = 0
    for (let day = 1; day <= totalDays; day++) {
      const entry = monthData[String(day)] || {}
      const isSat = new Date(year, month, day).getDay() === 6
      const hasOvr = entry.payOverride !== undefined && entry.payOverride !== ''
      if (!isSat) {
        const h = calcHours(entry.start || '', entry.end || '')
        if (h !== null) { totalMinutes += Math.round(h * 60); workedDays++ }
        if (hasOvr)          totalPay += parseFloat(entry.payOverride) || 0
        else if (h !== null) totalPay += h * (settings.hourlyRate || 70)
      } else {
        if (hasOvr) totalPay += parseFloat(entry.payOverride) || 0
      }
    }
    return { totalMinutes, workedDays, totalPay }
  }, [monthData, year, month, totalDays, settings.hourlyRate])

  const { totalMinutes, workedDays, totalPay } = summary
  const totalHoursVal = totalMinutes / 60
  const avg = workedDays > 0 ? totalHoursVal / workedDays : 0
  const grossPay = Math.round(totalPay)

  const empPct    = settings.employeePensionPct || 6
  const emrPct    = settings.employerPensionPct || 12.5
  const travel    = settings.travelAllowance    || 0

  // Pension deduction is based on the fixed monthly schedule (same as Benefits page)
  const MONTHLY_HOURS = 28 * 4.33  // 121.24 hrs — Sun–Thu 5h×5 + Fri 3h × 4.33 weeks
  const benefitsGross = Math.round(MONTHLY_HOURS * (settings.hourlyRate || 70))
  const empPension = pensionChecked ? Math.round(benefitsGross * empPct / 100) : 0
  const emrPension = Math.round(benefitsGross * emrPct / 100)
  const netPay     = grossPay - empPension + travel
  const fmt = n => '₪' + Math.round(n).toLocaleString('en-IL')

  return (
    <>
      {/* Print header (hidden on screen, visible on print) */}
      <div className="print-header">
        <div className="print-title">Work Hours Report</div>
        <div className="print-month">{MONTHS_EN[month]} {year}</div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-day">Day</th>
                <th className="col-date">Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th className="col-hours">Hours</th>
                <th className="col-pay">Pay (₪)</th>
                <th className="col-note">Note</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                <DayRow
                  key={day}
                  day={day}
                  month={month}
                  year={year}
                  entry={monthData[String(day)] || {}}
                  hourlyRate={settings.hourlyRate || 70}
                  totalDays={totalDays}
                  onEntryChange={onEntryChange}
                  onPayChange={onPayChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary card */}
      <div className="summary-card">
        <div className="summary-item">
          <span className="summary-label">Total Monthly Hours</span>
          <span className="summary-value">{fmtDecimal(totalHoursVal) || '0.00'}</span>
          <span className="summary-unit">hours</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Pay</span>
          <span className="summary-value">{Math.round(totalPay).toLocaleString('en-IL')}</span>
          <span className="summary-unit">₪</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Days Worked</span>
          <span className="summary-value">{workedDays}</span>
          <span className="summary-unit">days</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Hours / Day</span>
          <span className="summary-value">{fmtDecimal(avg) || '0.00'}</span>
          <span className="summary-unit">hours</span>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="payment-breakdown-card">
        <div className="pb-title">💳 Monthly Payment to Employee</div>
        <div className="pb-row">
          <span className="pb-label">Gross Pay (hours × rate)</span>
          <span className="pb-value">{fmt(grossPay)}</span>
        </div>
        <div className={`pb-row pb-deduct${!pensionChecked ? ' unchecked' : ''}`}>
          <label className="pb-pension-label pb-label">
            <input
              type="checkbox"
              className="pb-pension-cb"
              checked={pensionChecked}
              onChange={e => onPensionChange(e.target.checked)}
            />
            Employee Pension Deduction ({empPct}%)
          </label>
          <span className="pb-value">{pensionChecked ? '− ' + fmt(empPension) : '—'}</span>
        </div>
        <div className="pb-row pb-add">
          <span className="pb-label">Monthly Travel Allowance</span>
          <span className="pb-value">+ {fmt(travel)}</span>
        </div>
        <div className="pb-divider" />
        <div className="pb-row pb-total">
          <span className="pb-label">Net Amount to Pay Employee</span>
          <span className="pb-value">{fmt(netPay)}</span>
        </div>
        <div className="pb-row pb-employer">
          <span className="pb-label">🏦 Employer Pension Contribution ({emrPct}%) — paid separately to fund</span>
          <span className="pb-value">{fmt(emrPension)}</span>
        </div>
      </div>

      {/* Rates bar */}
      <div className="rates-bar">
        <div className="rates-bar-item">
          <span className="rates-bar-label">Hourly Rate</span>
          <span className="rates-bar-value">{settings.hourlyRate || 70} ₪</span>
        </div>
        <div className="rates-bar-divider" />
        <div className="rates-bar-item">
          <span className="rates-bar-label">Monthly Travel Allowance</span>
          <span className="rates-bar-value">{settings.travelAllowance || 315} ₪</span>
        </div>
      </div>
    </>
  )
}
