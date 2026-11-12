// Date/time + layout helpers for the hand-built booking calendar.
// Everything works in the browser's local time zone (hotel time).

export const DAY_START_HOUR = 6
export const DAY_END_HOUR = 23
export const SLOT_MIN = 30 // one grid row
export const SLOT_PX = 40 // height of one grid row
export const SNAP_MIN = 15 // drag / resize granularity
export const PX_PER_MIN = SLOT_PX / SLOT_MIN
export const DAY_START_MIN = DAY_START_HOUR * 60
export const DAY_END_MIN = DAY_END_HOUR * 60
export const GRID_HEIGHT = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN

export const STATUS = {
  confirmed: { label: 'Confirmed', bg: '#dcfce7', fg: '#14532d', dot: '#16a34a', bd: '#bbf7d0' },
  tentative: { label: 'Tentative', bg: '#fef3c7', fg: '#78350f', dot: '#d97706', bd: '#fde68a' },
  waiting_list: { label: 'Waiting list', bg: '#dbeafe', fg: '#1e3a8a', dot: '#2563eb', bd: '#bfdbfe' },
  completed: { label: 'Completed', bg: '#f3f4f6', fg: '#374151', dot: '#6b7280', bd: '#e5e7eb' },
  cancelled: { label: 'Cancelled', bg: '#ffffff', fg: '#991b1b', dot: '#dc2626', bd: '#fca5a5' },
}
export const STATUS_ORDER = ['confirmed', 'tentative', 'waiting_list', 'completed', 'cancelled']
export const statusOf = (s) => STATUS[s] || STATUS.tentative

export const parseTs = (s) => new Date(String(s).replace('.000000Z', 'Z'))

export const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const addMonths = (d, n) => {
  const x = new Date(d)
  x.setDate(1)
  x.setMonth(x.getMonth() + n)
  return x
}
// Weeks start on Monday
export const startOfWeek = (d) => {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7
  return addDays(x, -dow)
}
export const startOfMonth = (d) => {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}
export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const pad = (n) => String(n).padStart(2, '0')
// Local YYYY-MM-DD (never toISOString, which shifts the date in UTC+8)
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const minToHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
export const minutesOfDay = (d) => d.getHours() * 60 + d.getMinutes()
export const atMinutes = (day, minutes) => {
  const x = startOfDay(day)
  x.setMinutes(minutes)
  return x
}

/** Visible range for a view. `end` is exclusive. */
export const getRange = (view, date) => {
  if (view === 'day') {
    const start = startOfDay(date)
    return { start, end: addDays(start, 1) }
  }
  if (view === 'week') {
    const start = startOfWeek(date)
    return { start, end: addDays(start, 7) }
  }
  const gridStart = startOfWeek(startOfMonth(date))
  return { start: gridStart, end: addDays(gridStart, 42) }
}

export const formatTitle = (view, date) => {
  if (view === 'day') {
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    const s = startOfWeek(date)
    const e = addDays(s, 6)
    const sameMonth = s.getMonth() === e.getMonth()
    const left = s.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })
    const right = e.toLocaleDateString('en-GB', { day: 'numeric', month: sameMonth ? 'long' : 'short', year: 'numeric' })
    return `${left} – ${right}`
  }
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** Turn an API booking row into what the calendar renders. */
export const normalizeBooking = (b) => {
  const start = parseTs(b.start_time)
  const end = b.end_time ? parseTs(b.end_time) : new Date(start.getTime() + (b.duration || 60) * 60000)
  return {
    id: b.id,
    raw: b,
    start,
    end,
    duration: Math.max(1, Math.round((end - start) / 60000)),
    status: b.status,
    guest: b.guest_name,
    treatment: b.treatment,
    therapist: b.therapist,
    room: b.room,
    roomId: b.room_id,
    therapistId: b.therapist_id,
  }
}

/**
 * Side-by-side layout for overlapping bookings in one column.
 * Returns the bookings with `lane` and `lanes` added.
 */
export const layoutLanes = (items) => {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end)
  const out = []
  let cluster = []
  let clusterEnd = -Infinity
  const flush = () => {
    const laneEnds = []
    const placed = cluster.map((it) => {
      let lane = laneEnds.findIndex((end) => end <= it.start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(it.end)
      } else {
        laneEnds[lane] = it.end
      }
      return { ...it, lane }
    })
    placed.forEach((p) => out.push({ ...p, lanes: laneEnds.length }))
    cluster = []
  }
  sorted.forEach((it) => {
    if (it.start >= clusterEnd && cluster.length) flush()
    cluster.push(it)
    clusterEnd = Math.max(clusterEnd, it.end.getTime ? it.end.getTime() : it.end)
  })
  if (cluster.length) flush()
  return out
}
