import { useState } from 'react'
import { addDays, getRange, sameDay, ymd, hhmm, statusOf, minutesOfDay } from './calendarUtils'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_ITEMS = 3

/**
 * Month overview. Shows the first three bookings per day, "+ n more" opens
 * the day view, and bookings can be dragged onto another day (time kept).
 */
const MonthGrid = ({ date, now, bookingsByDay, selectedId, onSelect, onOpenDay, onCreate, onMoveToDay }) => {
  const [dragId, setDragId] = useState(null)
  const [overKey, setOverKey] = useState(null)
  const { start } = getRange('month', date)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const allBookings = Object.values(bookingsByDay).flat()

  const handleDrop = (e, day) => {
    e.preventDefault()
    setOverKey(null)
    const id = e.dataTransfer.getData('text/plain') || dragId
    setDragId(null)
    const b = allBookings.find((x) => String(x.id) === String(id))
    if (!b || sameDay(b.start, day)) return
    const next = new Date(day)
    next.setHours(0, 0, 0, 0)
    next.setMinutes(minutesOfDay(b.start))
    onMoveToDay?.(b, next)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DOW.map((d) => (
            <div key={d} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const key = ymd(day)
            const inMonth = day.getMonth() === date.getMonth()
            const isToday = sameDay(day, now)
            const items = (bookingsByDay[key] || []).slice().sort((a, b) => a.start - b.start)
            const active = items.filter((b) => b.status !== 'cancelled').length
            const shown = items.slice(0, MAX_ITEMS)
            const more = items.length - shown.length
            return (
              <div
                key={key}
                onClick={(e) => { if (e.target === e.currentTarget) onCreate?.(day) }}
                onDragOver={(e) => { e.preventDefault(); if (overKey !== key) setOverKey(key) }}
                onDragLeave={() => setOverKey((k) => (k === key ? null : k))}
                onDrop={(e) => handleDrop(e, day)}
                className={`min-h-[140px] p-2 flex flex-col gap-1 border-t border-gray-100 cursor-cell ${i % 7 ? 'border-l' : ''} ${
                  overKey === key ? 'bg-gray-100' : inMonth ? (isToday ? 'bg-gray-50' : 'bg-white') : 'bg-gray-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenDay?.(day)}
                    aria-label={`Open ${day.toDateString()}`}
                    className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] font-semibold hover:ring-1 hover:ring-gray-300 ${
                      isToday ? 'bg-gray-900 text-white' : inMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                  {active > 0 && <span className="text-[11px] font-medium text-gray-500">{active} booked</span>}
                </div>
                {shown.map((b) => {
                  const s = statusOf(b.status)
                  const cancelled = b.status === 'cancelled'
                  return (
                    <button
                      key={b.id}
                      type="button"
                      draggable={!cancelled}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(b.id)); e.dataTransfer.effectAllowed = 'move'; setDragId(b.id) }}
                      onDragEnd={() => { setDragId(null); setOverKey(null) }}
                      onClick={() => onSelect?.(b.id)}
                      className={`flex items-center gap-1.5 w-full min-h-[24px] px-2 py-0.5 rounded-md text-left text-xs overflow-hidden ${
                        selectedId === b.id ? 'ring-2 ring-gray-900' : ''
                      } ${dragId === b.id ? 'opacity-40' : ''} ${inMonth ? '' : 'opacity-60'}`}
                      style={{
                        background: s.bg,
                        color: s.fg,
                        textDecoration: cancelled ? 'line-through' : 'none',
                        outline: cancelled ? `1px dashed ${s.bd}` : 'none',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: s.dot }} />
                      <span className="font-semibold">{hhmm(b.start)}</span>
                      <span className="truncate">{b.guest}</span>
                    </button>
                  )
                })}
                {more > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay?.(day)}
                    className="self-start px-1 py-0.5 text-xs font-medium text-gray-700 underline hover:text-gray-900"
                  >
                    + {more} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MonthGrid
