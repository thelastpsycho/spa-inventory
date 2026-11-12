import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DAY_START_HOUR, DAY_END_HOUR, DAY_START_MIN, DAY_END_MIN, SLOT_MIN, PX_PER_MIN, SNAP_MIN, GRID_HEIGHT,
  statusOf, minutesOfDay, minToHHMM, layoutLanes,
} from './calendarUtils'

const gridBackground = {
  backgroundImage:
    'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(#f3f4f6 1px, transparent 1px)',
  backgroundSize: `100% ${SLOT_MIN * 2 * PX_PER_MIN}px, 100% ${SLOT_MIN * PX_PER_MIN}px`,
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/**
 * Vertical time grid used by both the Day (columns = rooms) and Week
 * (columns = days) views. Handles click-to-create, click-to-select,
 * drag-to-move (across columns too) and drag-to-resize with pointer events.
 *
 * columns: [{ key, label, sublabel?, isToday?, date, roomId?, onHeaderClick? }]
 * bookingsByCol: { [colKey]: normalizedBooking[] }
 * onMove(booking, { start: Date, roomId }) / onResize(booking, minutes) / onSlotClick(col, minutes)
 */
const TimeGrid = ({
  columns, bookingsByCol, selectedId, now, minColWidth = 140, compact = false,
  onSelect, onSlotClick, onMove, onResize,
}) => {
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)
  const justDragged = useRef(false)
  const scrollRef = useRef(null)
  const latest = useRef({})
  latest.current = { columns, onSelect, onMove, onResize }

  // Scroll to "now" (today) or 08:00 when the visible columns change
  const colSig = columns.map((c) => c.key).join('|')
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const hasToday = columns.some((c) => c.isToday)
    const target = hasToday ? minutesOfDay(now) - 90 : 8 * 60
    el.scrollTop = Math.max(0, (clamp(target, DAY_START_MIN, DAY_END_MIN) - DAY_START_MIN) * PX_PER_MIN)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colSig])

  const dragging = drag !== null
  useEffect(() => {
    if (!dragging) return undefined
    const onPointerMove = (e) => {
      const d = dragRef.current
      if (!d) return
      const dy = e.clientY - d.startY
      const dx = e.clientX - d.startX
      const moved = d.moved || Math.abs(dy) > 4 || Math.abs(dx) > 4
      const deltaMin = Math.round(dy / PX_PER_MIN / SNAP_MIN) * SNAP_MIN
      let colKey = d.colKey
      if (d.mode === 'move') {
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-col]')
        if (el) colKey = el.getAttribute('data-col')
      }
      const next = { ...d, moved, deltaMin, colKey }
      dragRef.current = next
      setDrag(next)
    }
    const finish = () => {
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (!d) return
      const { columns: cols, onSelect: select, onMove: move, onResize: resize } = latest.current
      if (!d.moved) {
        select?.(d.booking.id)
        return
      }
      justDragged.current = true
      setTimeout(() => { justDragged.current = false }, 0)
      const b = d.booking
      if (d.mode === 'resize') {
        const minutes = Math.max(SNAP_MIN, b.duration + d.deltaMin)
        if (minutes !== b.duration) resize?.(b, minutes)
        return
      }
      const col = cols.find((c) => c.key === d.colKey)
      const startMin = clamp(minutesOfDay(b.start) + d.deltaMin, DAY_START_MIN, DAY_END_MIN - SNAP_MIN)
      const baseDay = col?.roomId != null ? b.start : (col?.date || b.start)
      const start = new Date(baseDay)
      start.setHours(0, 0, 0, 0)
      start.setMinutes(startMin)
      const roomId = col?.roomId != null ? col.roomId : b.roomId
      if (start.getTime() === b.start.getTime() && String(roomId) === String(b.roomId)) return
      move?.(b, { start, roomId })
    }
    const cancel = (e) => {
      if (e.key === 'Escape') {
        dragRef.current = null
        setDrag(null)
      }
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('keydown', cancel)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('keydown', cancel)
    }
  }, [dragging])

  const beginDrag = (e, booking, colKey, mode) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const locked = booking.status === 'cancelled'
    const d = {
      booking, colKey, origColKey: colKey, mode: locked ? 'none' : mode,
      startX: e.clientX, startY: e.clientY, deltaMin: 0, moved: false,
    }
    if (locked) {
      // Cancelled bookings are click-only
      onSelect?.(booking.id)
      return
    }
    dragRef.current = d
    setDrag(d)
  }

  const handleColumnClick = (e, col) => {
    if (justDragged.current || e.target !== e.currentTarget) return
    const minutes = DAY_START_MIN + Math.floor(e.nativeEvent.offsetY / PX_PER_MIN / SLOT_MIN) * SLOT_MIN
    onSlotClick?.(col, clamp(minutes, DAY_START_MIN, DAY_END_MIN - SLOT_MIN))
  }

  const laidOut = useMemo(() => {
    const map = {}
    columns.forEach((c) => { map[c.key] = layoutLanes(bookingsByCol[c.key] || []) })
    return map
  }, [columns, bookingsByCol])

  const hours = []
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h)

  const nowMin = minutesOfDay(now)
  const showNow = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN
  const nowTop = (nowMin - DAY_START_MIN) * PX_PER_MIN

  const renderBooking = (b, col, { ghost = false } = {}) => {
    const s = statusOf(b.status)
    const isDragged = drag?.moved && drag.booking.id === b.id
    let startMin = minutesOfDay(b.start)
    let duration = b.duration
    if (ghost) {
      if (drag.mode === 'move') startMin = clamp(startMin + drag.deltaMin, DAY_START_MIN, DAY_END_MIN - SNAP_MIN)
      else duration = Math.max(SNAP_MIN, duration + drag.deltaMin)
    }
    const top = (startMin - DAY_START_MIN) * PX_PER_MIN + 1
    const height = Math.max(20, duration * PX_PER_MIN - 3)
    const lanes = ghost ? 1 : b.lanes || 1
    const lane = ghost ? 0 : b.lane || 0
    const w = 100 / lanes
    const cancelled = b.status === 'cancelled'
    const selected = selectedId === b.id
    const endLabel = minToHHMM(startMin + duration)
    const timeLabel = `${minToHHMM(startMin)}–${endLabel}`
    const sub = [b.treatment?.name, b.therapist?.name].filter(Boolean).join(' · ')

    return (
      <button
        key={ghost ? `ghost-${b.id}` : b.id}
        type="button"
        aria-label={`${b.guest}, ${timeLabel}, ${s.label}`}
        aria-pressed={selected}
        onPointerDown={ghost ? undefined : (e) => beginDrag(e, b, col.key, 'move')}
        onClick={(e) => { if (e.detail === 0) onSelect?.(b.id) }}
        className="absolute flex flex-col gap-0.5 overflow-hidden rounded-lg text-left select-none touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        style={{
          top,
          height,
          left: `calc(${w * lane}% + 3px)`,
          width: `calc(${w}% - 6px)`,
          padding: compact ? '5px 7px' : '7px 10px',
          background: s.bg,
          color: s.fg,
          border: `1px ${cancelled ? 'dashed' : 'solid'} ${s.bd}`,
          textDecoration: cancelled ? 'line-through' : 'none',
          cursor: cancelled ? 'pointer' : (drag ? 'grabbing' : 'grab'),
          opacity: isDragged && !ghost ? 0.35 : 1,
          boxShadow: ghost ? '0 8px 24px rgba(17,24,39,0.18)' : (selected ? '0 0 0 2px #111827' : 'none'),
          zIndex: ghost ? 20 : (selected ? 3 : 2),
          pointerEvents: ghost ? 'none' : 'auto',
        }}
      >
        <span className={`flex items-center gap-1.5 font-semibold truncate ${compact ? 'text-xs' : 'text-[13px]'}`}>
          <span className="w-2 h-2 rounded-full flex-none" style={{ background: s.dot }} />
          <span className="truncate">{b.guest}</span>
        </span>
        {height >= 36 && (
          <span className={`${compact ? 'text-[11px]' : 'text-xs'} opacity-90 truncate`}>
            {compact && b.room?.name ? `${minToHHMM(startMin)} · ${b.room.name}` : timeLabel}
          </span>
        )}
        {height >= 56 && sub && (
          <span className={`${compact ? 'text-[11px]' : 'text-xs'} opacity-90 truncate`}>{sub}</span>
        )}
        {!ghost && !cancelled && (
          <span
            aria-hidden="true"
            onPointerDown={(e) => beginDrag(e, b, col.key, 'resize')}
            className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
          />
        )}
      </button>
    )
  }

  const gridCols = `repeat(${columns.length}, minmax(${minColWidth}px, 1fr))`

  return (
    <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)', minHeight: 420 }}>
      <div style={{ minWidth: 64 + columns.length * minColWidth }}>
        {/* Column headers */}
        <div className="flex sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="w-16 flex-none" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((c) => {
              const Tag = c.onHeaderClick ? 'button' : 'div'
              return (
                <Tag
                  key={c.key}
                  type={c.onHeaderClick ? 'button' : undefined}
                  onClick={c.onHeaderClick}
                  className={`flex items-center gap-2 px-3 py-2.5 border-l border-gray-100 text-left min-w-0 ${c.onHeaderClick ? 'hover:bg-gray-50' : ''}`}
                >
                  {c.render ? c.render() : (
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">{c.label}</span>
                      {c.sublabel && <span className="text-xs text-gray-500">{c.sublabel}</span>}
                    </span>
                  )}
                </Tag>
              )
            })}
          </div>
        </div>

        {/* Grid body */}
        <div className="flex">
          <div className="w-16 flex-none relative" style={{ height: GRID_HEIGHT }}>
            {hours.filter((h) => !(showNow && columns.some((c) => c.isToday) && Math.abs(h * 60 - nowMin) < 12)).map((h) => (
              <span
                key={h}
                className="absolute right-2.5 text-xs text-gray-500"
                style={{ top: h === DAY_START_HOUR ? 4 : (h * 60 - DAY_START_MIN) * PX_PER_MIN - 7 }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
            {showNow && columns.some((c) => c.isToday) && (
              <span
                className="absolute right-1.5 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ top: nowTop - 10 }}
              >
                {minToHHMM(nowMin)}
              </span>
            )}
          </div>

          <div className="flex-1 grid relative" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((c) => {
              const items = laidOut[c.key] || []
              const ghostHere = drag?.moved && drag.colKey === c.key
              return (
                <div
                  key={c.key}
                  data-col={c.key}
                  onClick={(e) => handleColumnClick(e, c)}
                  className="relative border-l border-gray-100 cursor-cell"
                  style={{ height: GRID_HEIGHT, ...gridBackground, backgroundColor: c.isToday && columns.length > 1 ? '#fafafa' : undefined }}
                >
                  {items.map((b) => renderBooking(b, c))}
                  {ghostHere && renderBooking(drag.booking, c, { ghost: true })}
                  {showNow && c.isToday && (
                    <div aria-hidden="true" className="absolute left-0 right-0 h-0.5 bg-red-600 pointer-events-none z-10" style={{ top: nowTop }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeGrid
