import React, { useRef } from 'react'

const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function isValidTime(val) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val)
}
function calcHours(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff / 60 : null
}
function fmtDecimal(h) { return h === null ? null : h.toFixed(2) }
function fmtDate(d, m, y) {
  return `${String(d).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`
}

export default function DayRow({ day, month, year, entry, hourlyRate, totalDays, onEntryChange, onPayChange }) {
  const dow = new Date(year, month, day).getDay()
  const isSat = dow === 6
  const deletingRef = useRef(false)

  // Saturday row
  if (isSat) {
    const satPayOverride = entry?.payOverride
    const hasOverride = satPayOverride !== undefined && satPayOverride !== ''
    const displayPay = hasOverride ? satPayOverride : ''

    function handleSatPayChange(e) {
      const val = e.target.value.trim()
      onPayChange(day, val, '')
    }

    return (
      <tr className="row-saturday">
        <td className="col-day">{DAYS_EN[dow]}</td>
        <td className="col-date">{fmtDate(day, month, year)}</td>
        <td colSpan={3} className="sat-label">Day Off</td>
        <td className="col-pay">
          <input
            type="text"
            inputMode="numeric"
            className={`pay-input${hasOverride ? ' pay-manual' : ''}`}
            defaultValue={displayPay}
            placeholder="—"
            data-day={day}
            onBlur={handleSatPayChange}
            onFocus={e => e.target.select()}
          />
        </td>
        <td className="col-note">
          <input
            type="text"
            placeholder="Note..."
            defaultValue={entry?.note || ''}
            maxLength={40}
            onBlur={e => onEntryChange(day, 'note', e.target.value)}
          />
        </td>
      </tr>
    )
  }

  // Normal day row
  const h = calcHours(entry?.start || '', entry?.end || '')
  const autoPayVal = h !== null ? Math.round(h * hourlyRate) : ''
  const hasOverride = entry?.payOverride !== undefined && entry?.payOverride !== ''
  const displayPayVal = hasOverride ? entry.payOverride : autoPayVal
  const isManualPay = hasOverride

  function handleTimeKeyDown(e, field) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      deletingRef.current = true
      return
    }
    deletingRef.current = false
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (field === 'start') {
      const endInput = document.querySelector(`.time-input[data-day="${day}"][data-field="end"]`)
      if (endInput) endInput.focus()
    } else {
      for (let d = day + 1; d <= totalDays; d++) {
        const c = document.querySelector(`.time-input[data-day="${d}"][data-field="start"]`)
        if (c) { c.focus(); break }
      }
    }
  }

  function handleTimeInput(e, field) {
    const inp = e.target
    let v = inp.value.replace(/[^0-9:]/g, '')
    if (!deletingRef.current && v.length === 2 && !v.includes(':')) v += ':'
    if (v.length > 5) v = v.slice(0, 5)
    inp.value = v
    deletingRef.current = false
    inp.classList.toggle('invalid', v.length === 5 && !isValidTime(v))
    if (isValidTime(v)) {
      onEntryChange(day, field, v)
    }
  }

  function handleTimeBlur(e, field) {
    const inp = e.target
    const v = inp.value.trim()
    if (v === '') {
      inp.classList.remove('invalid')
      onEntryChange(day, field, '')
      return
    }
    if (!isValidTime(v)) {
      inp.classList.add('invalid')
      return
    }
    if (field === 'end') {
      const startVal = entry?.start || ''
      if (!startVal) { inp.classList.add('invalid'); return }
    }
    inp.classList.remove('invalid')
    onEntryChange(day, field, v)
  }

  function handlePayChange(e) {
    const inp = e.target
    const val = inp.value.trim()
    const autoStr = String(autoPayVal)
    onPayChange(day, val, autoStr)
  }

  const hDisplay = h !== null
    ? <span className="hours-val">{fmtDecimal(h)}</span>
    : <span className="hours-zero">—</span>

  return (
    <tr>
      <td className="col-day">{DAYS_EN[dow]}</td>
      <td className="col-date">{fmtDate(day, month, year)}</td>
      <td>
        <input
          type="text"
          className="time-input"
          placeholder="--:--"
          maxLength={5}
          defaultValue={entry?.start || ''}
          data-day={day}
          data-field="start"
          onKeyDown={e => handleTimeKeyDown(e, 'start')}
          onInput={e => handleTimeInput(e, 'start')}
          onBlur={e => handleTimeBlur(e, 'start')}
          onFocus={e => e.target.select()}
        />
      </td>
      <td>
        <input
          type="text"
          className="time-input"
          placeholder="--:--"
          maxLength={5}
          defaultValue={entry?.end || ''}
          data-day={day}
          data-field="end"
          onKeyDown={e => handleTimeKeyDown(e, 'end')}
          onInput={e => handleTimeInput(e, 'end')}
          onBlur={e => handleTimeBlur(e, 'end')}
          onFocus={e => e.target.select()}
        />
      </td>
      <td className="col-hours">{hDisplay}</td>
      <td className="col-pay">
        <input
          type="text"
          inputMode="numeric"
          className={`pay-input${isManualPay ? ' pay-manual' : ''}`}
          defaultValue={displayPayVal}
          data-day={day}
          data-auto={autoPayVal}
          placeholder="—"
          title={isManualPay ? 'Manual value — clear to restore auto-calculation' : 'Click to edit manually'}
          onBlur={handlePayChange}
          onFocus={e => e.target.select()}
        />
      </td>
      <td className="col-note">
        <input
          type="text"
          placeholder="Note..."
          defaultValue={entry?.note || ''}
          maxLength={40}
          onBlur={e => onEntryChange(day, 'note', e.target.value)}
        />
      </td>
    </tr>
  )
}
