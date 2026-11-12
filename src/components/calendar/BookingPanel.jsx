import { statusOf, hhmm } from './calendarUtils'

const Row = ({ label, children }) => (
  <>
    <dt className="text-gray-500">{label}</dt>
    <dd className="m-0 text-gray-900 break-words">{children}</dd>
  </>
)

/** Right-hand panel: details + quick actions for the selected booking, and "Up next". */
const BookingPanel = ({ booking, now, upNext = [], onSelect, onEdit, onComplete, onCancel, onClose }) => {
  return (
    <aside aria-label="Booking details" className="w-full lg:w-80 flex-none flex flex-col gap-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
        {booking ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5 min-w-0">
                {(() => {
                  const s = statusOf(booking.status)
                  const live = booking.status === 'confirmed' && now >= booking.start && now < booking.end
                  return (
                    <span
                      className="self-start inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                      {live ? `In progress · ${s.label}` : s.label}
                    </span>
                  )
                })()}
                <h2 className="text-lg font-semibold text-gray-900 truncate">{booking.guest}</h2>
                <span className="text-sm text-gray-600">
                  {booking.start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}{hhmm(booking.start)}–{hhmm(booking.end)} · {booking.duration} min
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="w-9 h-9 flex-none rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <dl className="m-0 grid grid-cols-[96px_1fr] gap-y-2.5 text-sm">
              <Row label="Treatment">{booking.treatment?.name || '—'}</Row>
              <Row label="Therapist">{booking.therapist?.name || '—'}</Row>
              <Row label="Room">{booking.room?.name || '—'}</Row>
              <Row label="Email">{booking.raw.guest_email || '—'}</Row>
              <Row label="Phone">{booking.raw.guest_phone || '—'}</Row>
              <Row label="Notes"><span className="text-gray-700">{booking.raw.notes || 'No notes'}</span></Row>
            </dl>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onEdit}
                className="flex-auto h-11 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
              >
                Edit booking
              </button>
              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Mark completed
                </button>
              )}
              {booking.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-11 px-4 rounded-lg border border-red-200 bg-white text-red-700 text-sm font-medium hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-gray-900">No booking selected</p>
            <p className="mt-1 text-sm text-gray-500">Click a booking to see its details, or click an empty slot to create one.</p>
          </div>
        )}
      </div>

      {upNext.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Up next</h3>
          {upNext.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect?.(b.id)}
              className="flex items-center gap-3 min-h-[44px] px-3 py-2.5 border border-gray-100 rounded-lg bg-white text-left hover:bg-gray-50"
            >
              <span className="w-11 flex-none text-[13px] font-semibold text-gray-900">{hhmm(b.start)}</span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">{b.guest}</span>
                <span className="text-xs text-gray-500 truncate">
                  {[b.treatment?.name, b.therapist?.name, b.room?.name].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="ml-auto w-2 h-2 rounded-full flex-none" style={{ background: statusOf(b.status).dot }} />
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}

export default BookingPanel
