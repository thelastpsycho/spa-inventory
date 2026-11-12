import { useState, useEffect, useMemo, useCallback } from 'react'
import { bookingAPI, treatmentAPI, therapistAPI, roomAPI } from '../services/api'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchableDropdown from '../components/SearchableDropdown'
import TimeGrid from '../components/calendar/TimeGrid'
import MonthGrid from '../components/calendar/MonthGrid'
import BookingPanel from '../components/calendar/BookingPanel'
import {
  STATUS, STATUS_ORDER, addDays, addMonths, startOfWeek, sameDay, ymd, hhmm, minToHHMM,
  getRange, formatTitle, normalizeBooking,
} from '../components/calendar/calendarUtils'

const VIEWS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

const fmtMove = (d) =>
  d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Shape the BookingModal expects (local date/time — not UTC)
const toModalBooking = (b) => ({
  ...b.raw,
  start: ymd(b.start),
  startTime: hhmm(b.start),
  guestName: b.raw.guest_name,
  guestEmail: b.raw.guest_email,
  guestPhone: b.raw.guest_phone,
  treatment: b.treatment,
  therapist: b.therapist,
  room: b.room,
  notes: b.raw.notes,
  status: b.status,
  duration: b.raw.duration,
})

const Calendar = () => {
  const [view, setView] = useState('day')
  const [date, setDate] = useState(() => new Date())
  const [now, setNow] = useState(() => new Date())
  const [bookings, setBookings] = useState([])
  const [treatments, setTreatments] = useState([])
  const [therapists, setTherapists] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState({ cancelled: true })
  const [therapistFilter, setTherapistFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [alert, setAlert] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const range = useMemo(() => getRange(view, date), [view, date])
  const rangeKey = `${ymd(range.start)}_${ymd(range.end)}`

  const showAlert = useCallback((type, message, ms = type === 'error' ? 5000 : 3000) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), ms)
  }, [])

  // Tick the "now" line every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [treatmentsRes, therapistsRes, roomsRes] = await Promise.all([
          treatmentAPI.getAll(),
          therapistAPI.getAll(),
          roomAPI.getAll(),
        ])
        setTreatments(treatmentsRes.data)
        setTherapists(therapistsRes.data)
        setRooms(roomsRes.data)
      } catch (error) {
        console.error('Error fetching resources:', error)
      }
    }
    fetchResources()
  }, [])

  const fetchBookings = useCallback(async () => {
    try {
      // One query for the visible range, cancelled included; status chips filter client-side
      const response = await bookingAPI.getAll({
        include_cancelled: 'true',
        start: range.start.toISOString(),
        end: new Date(range.end.getTime() - 1).toISOString(),
      })
      setBookings(response.data.map(normalizeBooking))
    } catch (error) {
      console.error('Error fetching bookings:', error)
      showAlert('error', 'Failed to load bookings: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, showAlert])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // ---------- derived data ----------
  const scoped = useMemo(() => bookings.filter((b) =>
    (!therapistFilter || String(b.therapistId) === String(therapistFilter)) &&
    (view === 'day' || !roomFilter || String(b.roomId) === String(roomFilter))
  ), [bookings, therapistFilter, roomFilter, view])

  const visible = useMemo(() => scoped.filter((b) => !hidden[b.status]), [scoped, hidden])

  const counts = useMemo(() => {
    const c = {}
    STATUS_ORDER.forEach((k) => { c[k] = 0 })
    scoped.forEach((b) => {
      if (view === 'month' && b.start.getMonth() !== date.getMonth()) return
      c[b.status] = (c[b.status] || 0) + 1
    })
    return c
  }, [scoped, view, date])

  const activeCount = STATUS_ORDER.filter((k) => k !== 'cancelled').reduce((n, k) => n + counts[k], 0)
  const totalLabel = view === 'day'
    ? `${activeCount} bookings ${sameDay(date, now) ? 'today' : 'this day'}`
    : view === 'week'
      ? `${activeCount} bookings this week`
      : `${activeCount} bookings in ${date.toLocaleDateString('en-GB', { month: 'long' })}`

  const selected = bookings.find((b) => b.id === selectedId) || null

  const dayColumns = useMemo(() => rooms.map((r) => {
    const n = bookings.filter((b) => String(b.roomId) === String(r.id) && b.status !== 'cancelled').length
    return {
      key: String(r.id),
      roomId: r.id,
      label: r.name,
      sublabel: `${n} ${n === 1 ? 'booking' : 'bookings'}`,
      date,
      isToday: sameDay(date, now),
    }
  }), [rooms, bookings, date, now])

  const weekColumns = useMemo(() => {
    const s = startOfWeek(date)
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(s, i)
      const isToday = sameDay(d, now)
      const n = scoped.filter((b) => sameDay(b.start, d) && b.status !== 'cancelled').length
      return {
        key: ymd(d),
        date: d,
        isToday,
        onHeaderClick: () => { setDate(d); setView('day') },
        render: () => (
          <>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {d.toLocaleDateString('en-GB', { weekday: 'short' })}
            </span>
            <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-semibold ${isToday ? 'bg-gray-900 text-white' : 'text-gray-900'}`}>
              {d.getDate()}
            </span>
            <span className="ml-auto text-xs text-gray-500">{n}</span>
          </>
        ),
      }
    })
  }, [date, now, scoped])

  const bookingsByCol = useMemo(() => {
    const map = {}
    visible.forEach((b) => {
      const key = view === 'day' ? String(b.roomId) : ymd(b.start)
      ;(map[key] = map[key] || []).push(b)
    })
    return map
  }, [visible, view])

  const upNext = useMemo(() => {
    if (view !== 'day' || !sameDay(date, now)) return []
    return visible
      .filter((b) => b.start > now && b.status !== 'cancelled' && b.id !== selectedId)
      .sort((a, b) => a.start - b.start)
      .slice(0, 4)
  }, [visible, view, date, now, selectedId])

  // ---------- navigation ----------
  const navigate = (dir) => {
    if (view === 'day') setDate((d) => addDays(d, dir))
    else if (view === 'week') setDate((d) => addDays(d, 7 * dir))
    else setDate((d) => addMonths(d, dir))
  }
  const goToday = () => setDate(new Date())
  const openDay = (d) => { setDate(d); setView('day') }

  // ---------- create / edit ----------
  const openCreate = (day, minutes, room = null) => {
    setSelectedBooking({
      start: ymd(day),
      startTime: minToHHMM(minutes),
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      treatment: null,
      therapist: null,
      room,
      notes: '',
      status: 'tentative',
      duration: '',
    })
    setShowModal(true)
  }

  const handleSlotClick = (col, minutes) => {
    const room = col.roomId != null ? rooms.find((r) => r.id === col.roomId) || null : null
    openCreate(col.date, minutes, room)
  }

  const openEdit = (b) => {
    setSelectedBooking(toModalBooking(b))
    setShowModal(true)
  }

  // ---------- updates ----------
  const confirmUpdate = ({ title, message, confirmText, data, booking, success }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await bookingAPI.update(booking.id, data)
          showAlert('success', success)
          fetchBookings()
        } catch (error) {
          showAlert('error', 'Failed to update booking: ' + (error.response?.data?.message || error.message))
        }
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  const handleMove = (b, { start, roomId }) => {
    const end = new Date(start.getTime() + b.duration * 60000)
    const roomChanged = String(roomId) !== String(b.roomId)
    const newRoom = rooms.find((r) => String(r.id) === String(roomId))
    const data = { start_time: start.toISOString(), duration: b.duration }
    if (roomChanged) data.room_id = roomId
    confirmUpdate({
      booking: b,
      title: 'Move Booking',
      message: `Move ${b.guest} to ${fmtMove(start)} – ${hhmm(end)}${roomChanged && newRoom ? ` in ${newRoom.name}` : ''}?`,
      confirmText: 'Move Booking',
      data,
      success: `Booking moved to ${fmtMove(start)}${roomChanged && newRoom ? ` · ${newRoom.name}` : ''}`,
    })
  }

  const handleResize = (b, minutes) => {
    const end = new Date(b.start.getTime() + minutes * 60000)
    confirmUpdate({
      booking: b,
      title: 'Change Duration',
      message: `Change ${b.guest}'s booking to end at ${hhmm(end)}? The duration becomes ${minutes} minutes.`,
      confirmText: 'Update Duration',
      data: { start_time: b.start.toISOString(), duration: minutes },
      success: `Booking duration updated to ${minutes} minutes`,
    })
  }

  const handleMoveToDay = (b, start) => handleMove(b, { start, roomId: b.roomId })

  const handleComplete = async (b) => {
    try {
      await bookingAPI.update(b.id, { status: 'completed' })
      showAlert('success', `${b.guest} marked as completed`)
      fetchBookings()
    } catch (error) {
      showAlert('error', 'Failed to update booking: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleCancelBooking = (b) => confirmUpdate({
    booking: b,
    title: 'Cancel Booking',
    message: `Cancel ${b.guest}'s booking on ${fmtMove(b.start)}? The time slot will be freed.`,
    confirmText: 'Cancel Booking',
    data: { status: 'cancelled' },
    success: 'Booking cancelled',
  })

  const toggleStatus = (k) => setHidden((h) => ({ ...h, [k]: !h[k] }))

  // ---------- render ----------
  const segBtn = (active) =>
    `px-4 py-2 text-sm rounded-md transition-colors ${active ? 'bg-white text-gray-900 font-semibold shadow-sm' : 'text-gray-600 font-medium hover:text-gray-900'}`
  const iconBtn = 'w-10 h-10 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50'
  const showPanel = view === 'day' || selected

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="bg-white border border-gray-100 rounded-xl px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Booking Calendar</h1>
            <p className="text-sm text-gray-500">{formatTitle(view, date)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => navigate(-1)} aria-label={`Previous ${view}`} className={iconBtn}>
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={goToday} className="h-10 px-4 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Today
              </button>
              <button type="button" onClick={() => navigate(1)} aria-label={`Next ${view}`} className={iconBtn}>
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <div role="tablist" aria-label="Calendar view" className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={segBtn(view === v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openCreate(date, Math.max(9 * 60, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30) % (24 * 60))}
              className="h-11 px-[18px] rounded-lg bg-gray-900 text-white text-sm font-semibold flex items-center gap-2 hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              New booking
            </button>
          </div>
        </div>

        {/* Status chips = legend + filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-gray-500 mr-1">{totalLabel}</span>
            {STATUS_ORDER.map((k) => {
              const s = STATUS[k]
              const on = !hidden[k]
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStatus(k)}
                  className={`h-9 px-3 rounded-full flex items-center gap-2 text-[13px] font-medium ${
                    on ? 'bg-white text-gray-900 border border-gray-200' : 'bg-gray-50 text-gray-500 border border-dashed border-gray-300 line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: on ? s.dot : '#d1d5db' }} />
                  {s.label}
                  <span className="font-semibold">{counts[k]}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] text-gray-700">
              Therapist
              <select
                value={therapistFilter}
                onChange={(e) => setTherapistFilter(e.target.value)}
                className="h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] text-gray-900 bg-white"
              >
                <option value="">All therapists</option>
                {therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            {view !== 'day' && (
              <label className="flex items-center gap-2 text-[13px] text-gray-700">
                Room
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="h-9 border border-gray-200 rounded-lg px-2.5 text-[13px] text-gray-900 bg-white"
                >
                  <option value="">All rooms</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <section aria-label="Calendar" className="w-full flex-1 min-w-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-100 border-t-gray-900" />
            </div>
          ) : view === 'month' ? (
            <MonthGrid
              date={date}
              now={now}
              bookingsByDay={bookingsByCol}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenDay={openDay}
              onCreate={(d) => openCreate(d, 9 * 60)}
              onMoveToDay={handleMoveToDay}
            />
          ) : view === 'day' && rooms.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-900">No rooms yet</p>
              <p className="mt-1 text-sm text-gray-500">Add rooms on the Rooms page to see the day schedule.</p>
            </div>
          ) : (
            <TimeGrid
              columns={view === 'day' ? dayColumns : weekColumns}
              bookingsByCol={bookingsByCol}
              selectedId={selectedId}
              now={now}
              minColWidth={view === 'day' ? 140 : 110}
              compact={view === 'week'}
              onSelect={setSelectedId}
              onSlotClick={handleSlotClick}
              onMove={handleMove}
              onResize={handleResize}
            />
          )}
        </section>

        {showPanel && (
          <BookingPanel
            booking={selected}
            now={now}
            upNext={upNext}
            onSelect={setSelectedId}
            onEdit={() => selected && openEdit(selected)}
            onComplete={() => selected && handleComplete(selected)}
            onCancel={() => selected && handleCancelBooking(selected)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      <p className="text-xs text-gray-500">
        {view === 'month'
          ? 'Drag a booking onto another day to move it. Click a date to open that day by room.'
          : 'Drag a booking to move it, drag its bottom edge to change duration, or click an empty slot to start a new booking.'}
      </p>

      {showModal && (
        <BookingModal
          booking={selectedBooking}
          treatments={treatments}
          therapists={therapists}
          rooms={rooms}
          setAlert={setAlert}
          onClose={() => {
            setShowModal(false)
            setSelectedBooking(null)
          }}
          onSave={() => {
            fetchBookings()
            setShowModal(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  )
}

const inputCls = 'w-full h-11 px-3.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors'
const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'
const sectionHeadCls = 'text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3'

const BookingModal = ({ booking, treatments, therapists, rooms, setAlert, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    guest_name: booking?.guestName || '',
    guest_email: booking?.guestEmail || '',
    guest_phone: booking?.guestPhone || '',
    nationality: booking?.nationality || '',
    source: booking?.source || '',
    treatment_id: booking?.treatment?.id || '',
    therapist_id: booking?.therapist?.id || '',
    room_id: booking?.room?.id || '',
    appointment_date: booking?.start || '',
    appointment_time: booking?.startTime || '',
    duration: booking?.duration || '',
    notes: booking?.notes || '',
    status: booking?.status || 'tentative',
    type: booking?.type || 'regular',
  })
  const [conflicts, setConflicts] = useState([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Combine date and time into start_time
      const start_time = new Date(`${formData.appointment_date}T${formData.appointment_time}`).toISOString()

      const submitData = {
        ...formData,
        start_time,
      }

      // Convert duration to integer if provided
      if (submitData.duration) {
        submitData.duration = parseInt(submitData.duration, 10)
      }

      // Remove appointment_date and appointment_time from submit data
      delete submitData.appointment_date
      delete submitData.appointment_time

      // Ensure status is included
      if (!submitData.status) {
        submitData.status = 'tentative'
      }

      if (booking?.id) {
        await bookingAPI.update(booking.id, submitData)
      } else {
        await bookingAPI.create(submitData)
      }
      onSave()
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to save booking: ' + (error.response?.data?.message || error.message)
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const checkConflicts = async () => {
    try {
      // Combine date and time into start_time for conflict checking
      const start_time = new Date(`${formData.appointment_date}T${formData.appointment_time}`).toISOString()

      // Get duration for end_time calculation (use custom duration or treatment duration)
      let duration = formData.duration
      if (!duration && formData.treatment_id) {
        const treatment = treatments.find(t => t.id === parseInt(formData.treatment_id))
        duration = treatment?.duration
      }

      let end_time
      if (duration && formData.appointment_date && formData.appointment_time) {
        const startDate = new Date(`${formData.appointment_date}T${formData.appointment_time}`)
        end_time = new Date(startDate.getTime() + duration * 60000).toISOString()
      }

      if (!start_time || !end_time) return

      const response = await bookingAPI.checkConflicts({
        therapist_id: formData.therapist_id,
        room_id: formData.room_id,
        start_time,
        end_time,
        exclude_booking_id: booking?.id,
      })
      setConflicts(response.data.conflicts)
    } catch (error) {
      console.error('Error checking conflicts:', error)
    }
  }

  useEffect(() => {
    if (formData.therapist_id && formData.room_id && formData.appointment_date && formData.appointment_time && (formData.duration || formData.treatment_id)) {
      checkConflicts()
    }
  }, [formData.therapist_id, formData.room_id, formData.appointment_date, formData.appointment_time, formData.duration, formData.treatment_id])

  const selectedTreatment = treatments.find((t) => t.id === parseInt(formData.treatment_id))
  const effectiveDuration = parseInt(formData.duration) || selectedTreatment?.duration || 0
  const endsAt = formData.appointment_date && formData.appointment_time && effectiveDuration
    ? new Date(new Date(`${formData.appointment_date}T${formData.appointment_time}`).getTime() + effectiveDuration * 60000)
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {booking?.id ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex-none rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {conflicts.length > 0 && (
            <div className="mb-5 bg-red-50 border border-red-100 p-3.5 rounded-lg">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-red-900 text-xs">Scheduling conflicts detected:</p>
                  <ul className="list-disc list-inside mt-1 text-xs text-red-700 space-y-1">
                    {conflicts.map((conflict) => (
                      <li key={conflict.id}>
                        {conflict.guest_name} - {conflict.treatment.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className={sectionHeadCls}>Guest Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Guest Name</label>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="Enter guest name"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nationality</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Australian"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Guest Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="guest@email.com"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Guest Phone</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="555-0100"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Source / Company</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Walk-in, Booking.com, ABC Travel"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h3 className={sectionHeadCls}>Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={inputCls}
                    required
                  >
                    <option value="regular">Regular</option>
                    <option value="package">Package</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={inputCls}
                    required
                  >
                    {STATUS_ORDER.map((k) => (
                      <option key={k} value={k}>{STATUS[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Treatment</label>
                  <SearchableDropdown
                    options={treatments}
                    value={formData.treatment_id}
                    onChange={(value) => {
                      const treatment = treatments.find(t => t.id === parseInt(value))
                      setFormData({
                        ...formData,
                        treatment_id: value,
                        duration: treatment?.duration || '',
                      })
                    }}
                    placeholder="Search treatments..."
                    displayField="name"
                    subtitleField="duration"
                    required={true}
                  />
                </div>
                <div>
                  <label className={labelCls}>Therapist</label>
                  <SearchableDropdown
                    options={therapists}
                    value={formData.therapist_id}
                    onChange={(value) => setFormData({ ...formData, therapist_id: value })}
                    placeholder="Search therapists..."
                    displayField="name"
                    required={true}
                  />
                </div>
                <div>
                  <label className={labelCls}>Room</label>
                  <SearchableDropdown
                    options={rooms}
                    value={formData.room_id}
                    onChange={(value) => setFormData({ ...formData, room_id: value })}
                    placeholder="Search rooms..."
                    displayField="name"
                    subtitleField="capacity"
                    required={true}
                  />
                </div>
              </div>
            </div>

            {/* Time */}
            <div>
              <h3 className={sectionHeadCls}>Appointment Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <input
                    type="time"
                    required
                    className={inputCls}
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    placeholder={selectedTreatment?.duration ? String(selectedTreatment.duration) : 'Auto'}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              {formData.treatment_id && (
                <div className="mt-3 p-3.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Treatment duration:</span> {selectedTreatment?.duration || 0} minutes
                  {formData.duration && (
                    <span className="ml-2">
                      · <span className="font-medium text-gray-900">Custom:</span> {formData.duration} minutes
                    </span>
                  )}
                  {endsAt && (
                    <span className="ml-2 block mt-1">
                      <span className="font-medium text-gray-900">Ends at:</span> {endsAt}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                rows="3"
                placeholder="Add any special requests or notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || conflicts.length > 0}
                className="h-11 px-5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Calendar
