import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { bookingAPI, treatmentAPI, therapistAPI, roomAPI } from '../services/api'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchableDropdown from '../components/SearchableDropdown'

// Helper functions for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return '#22c55e' // green
    case 'completed': return '#16a34a' // dark green
    case 'tentative': return '#f59e0b' // yellow
    case 'waiting_list': return '#3b82f6' // blue
    case 'cancelled': return '#ef4444' // red
    default: return '#007AFF'
  }
}

const getStatusBorderColor = (status) => {
  switch (status) {
    case 'confirmed': return '#16a34a' // dark green
    case 'completed': return '#15803d' // darker green
    case 'tentative': return '#d97706' // dark yellow
    case 'waiting_list': return '#2563eb' // dark blue
    case 'cancelled': return '#dc2626' // dark red
    default: return '#0051D5'
  }
}

const Calendar = () => {
  const [bookings, setBookings] = useState([])
  const [treatments, setTreatments] = useState([])
  const [therapists, setTherapists] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('resourceTimeGridDay')
  const [currentDateRange, setCurrentDateRange] = useState(null)
  const [showCancelledBookings, setShowCancelledBookings] = useState(false) // New filter state
  const [cancelledCount, setCancelledCount] = useState(0) // Track cancelled bookings count

  // Popover state
  const [popover, setPopover] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    booking: null,
    dateInfo: null
  })

  // Alert and Confirm Dialog states
  const [alert, setAlert] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const closePopover = () => {
    setPopover({ isOpen: false, x: 0, y: 0, booking: null, dateInfo: null })
  }

  const handlePopoverAction = (action) => {
    closePopover()
    if (action === 'create' && popover.dateInfo) {
      // Open create modal with the selected date/time
      const { start, end } = popover.dateInfo
      const startDate = new Date(start)
      setSelectedBooking({
        start: startDate.toISOString().split('T')[0], // Date portion
        startTime: startDate.toTimeString().substring(0, 5), // Time portion
        // Add empty extended props to avoid undefined errors
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        treatment: null,
        therapist: null,
        room: null,
        notes: '',
        status: 'tentative',
        duration: ''
      })
      setShowModal(true)
    } else if (action === 'edit' && popover.booking) {
      // Open edit modal
      setSelectedBooking(popover.booking)
      setShowModal(true)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popover.isOpen) {
        closePopover()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [popover.isOpen])

  useEffect(() => {
    fetchResources()
    fetchBookings()
  }, [])

  // Fetch bookings again when filter changes
  useEffect(() => {
    fetchBookings()
  }, [showCancelledBookings])

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

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getAll({
        include_cancelled: showCancelledBookings ? 'true' : 'false'
      })
      const events = response.data.map((booking) => {
        const startDate = new Date(booking.start_time)
        return {
          id: booking.id,
          resourceId: booking.room_id.toString(),
          title: `${booking.guest_name} | ${booking.treatment.name} | ${booking.therapist.name}`,
          start: booking.start_time.replace('.000000Z', 'Z'),
          end: booking.end_time.replace('.000000Z', 'Z'),
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
          textColor: '#374151',
          className: `event-${booking.status}`,
          extendedProps: {
            ...booking,
            start: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().substring(0, 5),
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            guestPhone: booking.guest_phone,
            treatment: booking.treatment,
            therapist: booking.therapist,
            room: booking.room,
            notes: booking.notes,
            status: booking.status,
            duration: booking.duration,
          },
        }
      })
      setBookings(events)

      // If we're not showing cancelled, fetch the count separately
      if (!showCancelledBookings) {
        const cancelledResponse = await bookingAPI.getAll({
          include_cancelled: 'true'
        })
        const cancelledCount = cancelledResponse.data.filter(b => b.status === 'cancelled').length
        setCancelledCount(cancelledCount)
      } else {
        setCancelledCount(0)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = async (info) => {
    // Get click position
    const clickX = info.jsEvent?.clientX || window.innerWidth / 2
    const clickY = info.jsEvent?.clientY || window.innerHeight / 2

    // Show popover for create action at click position
    setPopover({
      isOpen: true,
      x: clickX,
      y: clickY,
      booking: null,
      dateInfo: {
        start: new Date(info.start),
        end: new Date(info.end)
      }
    })
  }

  const handleEventClick = (clickInfo) => {
    clickInfo.jsEvent.preventDefault()
    clickInfo.jsEvent.stopPropagation()

    // Get click position
    const rect = clickInfo.jsEvent.target.getBoundingClientRect()
    setPopover({
      isOpen: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      booking: clickInfo.event.extendedProps,
      dateInfo: null
    })
  }

  const handleEventDrop = async (dropInfo) => {
    const startDate = new Date(dropInfo.event.start)
    const endDate = new Date(dropInfo.event.end)

    const formattedStart = startDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const formattedEnd = endDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Show confirm dialog
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Move Booking',
        message: `Move booking to ${formattedStart} - ${formattedEnd}? This will change the booking time.`,
        confirmText: 'Move Booking',
        cancelText: 'Cancel',
        onConfirm: async () => {
          setConfirmDialog(null)

          try {
            // Calculate duration in minutes
            const duration = Math.round((endDate - startDate) / 60000)

            await bookingAPI.update(dropInfo.event.id, {
              start_time: dropInfo.event.start.toISOString(),
              duration: parseInt(duration, 10),
            })

            // Show success message
            setAlert({
              type: 'success',
              message: `Booking successfully moved to ${formattedStart}`
            })

            setTimeout(() => setAlert(null), 3000)

            fetchBookings()
            resolve(true)
          } catch (error) {
            const errorMsg = 'Failed to update booking: ' + (error.response?.data?.message || error.message)
            setAlert({
              type: 'error',
              message: errorMsg
            })
            setTimeout(() => setAlert(null), 5000)
            dropInfo.revert()
            resolve(false)
          }
        },
        onCancel: () => {
          setConfirmDialog(null)
          dropInfo.revert()
          resolve(false)
        }
      })
    })
  }

  const handleEventResize = async (resizeInfo) => {
    const startDate = new Date(resizeInfo.event.start)
    const endDate = new Date(resizeInfo.event.end)

    const duration = Math.round((endDate - startDate) / 60000)

    const formattedEnd = endDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Show confirm dialog
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: 'Extend Booking',
        message: `Extend booking to ${formattedEnd}? This will change the booking duration to ${duration} minutes.`,
        confirmText: 'Extend Booking',
        cancelText: 'Cancel',
        onConfirm: async () => {
          setConfirmDialog(null)

          try {
            await bookingAPI.update(resizeInfo.event.id, {
              duration: parseInt(duration, 10),
            })

            // Show success message
            setAlert({
              type: 'success',
              message: `Booking duration successfully updated to ${duration} minutes`
            })

            setTimeout(() => setAlert(null), 3000)

            fetchBookings()
            resolve(true)
          } catch (error) {
            const errorMsg = 'Failed to update booking: ' + (error.response?.data?.message || error.message)
            setAlert({
              type: 'error',
              message: errorMsg
            })
            setTimeout(() => setAlert(null), 5000)
            resizeInfo.revert()
            resolve(false)
          }
        },
        onCancel: () => {
          setConfirmDialog(null)
          resizeInfo.revert()
          resolve(false)
        }
      })
    })
  }

  const goToToday = () => {
    const calendarApi = window.calendar?.getApi()
    if (calendarApi) {
      calendarApi.today()
    }
  }

  const navigateDate = (direction) => {
    const calendarApi = window.calendar?.getApi()
    if (calendarApi) {
      if (direction === 'prev') {
        calendarApi.prev()
      } else {
        calendarApi.next()
      }
    }
  }

  const changeView = (view) => {
    const calendarApi = window.calendar?.getApi()
    if (calendarApi) {
      calendarApi.changeView(view)
      setCurrentView(view)
    }
  }

  const formatDateRange = () => {
    if (!currentDateRange) return ''

    const { start, end } = currentDateRange

    const options = { month: 'long', year: 'numeric' }
    if (currentView === 'resourceTimeGridDay') {
      return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    } else if (currentView === 'timeGridWeek') {
      const weekStart = new Date(start)
      const weekEnd = new Date(end)
      weekEnd.setDate(weekEnd.getDate() - 1)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return start.toLocaleDateString('en-US', options)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Booking Calendar</h1>
            <p className="text-sm text-gray-500 font-normal">Manage spa appointments and schedules</p>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">{bookings.length}</p>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rooms</p>
              <p className="text-2xl font-semibold text-gray-900 mt-0.5">{rooms.length}</p>
            </div>
          </div>
        </div>

        {/* Booking Filter */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Show Bookings:</span>
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1" role="group">
              <button
                onClick={() => setShowCancelledBookings(false)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  !showCancelledBookings
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={!showCancelledBookings}
                type="button"
              >
                Active
              </button>
              <button
                onClick={() => setShowCancelledBookings(true)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 relative ${
                  showCancelledBookings
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={showCancelledBookings}
                type="button"
              >
                All Bookings
                {!showCancelledBookings && cancelledCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    {cancelledCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Status */}
          <div className="text-sm text-gray-500">
            {showCancelledBookings
              ? `${bookings.length} total bookings`
              : `${bookings.length} active bookings`
            }
            {!showCancelledBookings && cancelledCount > 0 && (
              <span className="ml-2 text-orange-600">(+{cancelledCount} cancelled)</span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white border border-gray-100 rounded-lg px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              title="Previous"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              title="Next"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Date Range Display */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDateRange()}
            </h2>
          </div>

          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => changeView('dayGridMonth')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                currentView === 'dayGridMonth'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView('timeGridWeek')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                currentView === 'timeGridWeek'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView('resourceTimeGridDay')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                currentView === 'resourceTimeGridDay'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-100 border-t-gray-900"></div>
          </div>
        ) : (
          <div>
            <style>
              {`
                .fc {
                  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
                }
                .fc-theme-standard td,
                .fc-theme-standard th {
                  border-color: rgba(0, 0, 0, 0.06);
                }
                .fc-theme-standard .fc-scrollgrid {
                  border-color: rgba(0, 0, 0, 0.06);
                }
                .fc-col-header-cell-cushion {
                  font-weight: 600;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: #8e8e93;
                  padding: 1rem 0.5rem;
                }
                .fc-daygrid-day-number {
                  font-weight: 600;
                  color: #000000 !important;
                  font-size: 0.875rem;
                  padding: 0.5rem;
                }
                .fc-daygrid-day {
                  background-color: #ffffff;
                }
                .fc-daygrid-day-body {
                  background-color: #ffffff;
                }
                .fc-daygrid-day-frame {
                  background-color: #ffffff;
                }
                .fc-timegrid-slot-label {
                  font-size: 0.75rem;
                  color: #8e8e93;
                  font-weight: 400;
                }
                .fc-event {
                  border: 1px solid #e5e7eb;
                  border-radius: 4px;
                  padding: 2px 6px;
                  font-size: 0.7rem;
                  font-weight: 400;
                  cursor: pointer;
                  background-color: #f9fafb !important;
                  color: #374151 !important;
                }
                .fc-event:hover {
                  background-color: #f3f4f6 !important;
                  border-color: #d1d5db;
                }
                .fc-event-title,
                .fc-event-time {
                  color: inherit !important;
                  font-weight: 400;
                  font-size: 0.7rem;
                }
                /* Status-based color coding */
                .fc-event.event-confirmed {
                  background-color: #dcfce7 !important;
                  border-color: #86efac !important;
                  color: #166534 !important;
                }
                .fc-event.event-completed {
                  background-color: #bbf7d0 !important;
                  border-color: #4ade80 !important;
                  color: #14532d !important;
                }
                .fc-event.event-tentative {
                  background-color: #fef3c7 !important;
                  border-color: #fcd34d !important;
                  color: #92400e !important;
                }
                .fc-event.event-waiting_list {
                  background-color: #dbeafe !important;
                  border-color: #60a5fa !important;
                  color: #1e40af !important;
                }
                .fc-event.event-cancelled {
                  background-color: #fee2e2 !important;
                  border-color: #fca5a5 !important;
                  color: #991b1b !important;
                  text-decoration: line-through;
                  opacity: 0.7;
                }
                .fc-daygrid-event {
                  background-color: #f9fafb !important;
                  border: 1px solid #e5e7eb !important;
                  color: #374151 !important;
                }
                .fc-timegrid-event {
                  background-color: #f9fafb !important;
                  border: 1px solid #e5e7eb !important;
                  color: #374151 !important;
                }
                .fc-toolbar-title {
                  font-weight: 600;
                  font-size: 1rem;
                  color: #000000;
                  letter-spacing: -0.01em;
                }
                .fc-button {
                  display: none;
                }
                .fc-daygrid-day.fc-day-today {
                  background-color: #f5f5f7 !important;
                }
                .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                  color: #000000 !important;
                }
                .fc-resource-area {
                  width: 140px;
                }
                .fc-resource-area-col {
                  width: 140px;
                }
                .fc-resource-area {
                  position: sticky !important;
                  top: 0 !important;
                  z-index: 50 !important;
                }
                .fc-resource {
                  position: sticky !important;
                  top: 0 !important;
                  z-index: 50 !important;
                }
                .fc-resource-area-header {
                  position: sticky !important;
                  top: 0 !important;
                  z-index: 50 !important;
                }
                .fc-datagrid-cell {
                  padding: 8px 12px;
                  border-right: 1px solid rgba(0, 0, 0, 0.06);
                  background-color: #ffffff;
                }
                .fc-datagrid-cell-main {
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: #000000;
                }
                .fc-timegrid-slot {
                  height: 60px;
                }
                .fc-timegrid-slot-lane {
                  height: 60px;
                  background-color: #ffffff;
                }
                .fc-scrollgrid-shrink {
                  width: 50px;
                }
                .fc-timegrid-axis {
                  width: 50px;
                }
                .fc-daygrid-more-link {
                  color: #007AFF !important;
                  font-weight: 500;
                }
                /* Month view event styling */
                .fc-daygrid-event {
                  font-size: 0.65rem;
                  line-height: 1.1;
                  padding: 1px 2px;
                }
                .fc-daygrid-event .fc-event-title {
                  font-size: 0.65rem;
                  font-weight: 300;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
                .fc-daygrid-event .fc-event-time {
                  font-size: 0.6rem;
                  font-weight: 300;
                  opacity: 0.8;
                }
              `}
            </style>
            <FullCalendar
              ref={(calendar) => {
                if (calendar) {
                  window.calendar = calendar
                }
              }}
              plugins={[dayGridPlugin, timeGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
              initialView="resourceTimeGridDay"
              headerToolbar={false}
              resources={rooms.map(room => ({
                id: room.id.toString(),
                title: room.name,
              }))}
              events={bookings}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              editable={true}
              droppable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              dateClick={(info) => {
                // Handle clicks on time slots in day/week views
                handleDateSelect({
                  start: info.date,
                  end: info.date,
                  startStr: info.date.toISOString(),
                  endStr: info.date.toISOString(),
                  jsEvent: info.jsEvent,
                  view: info.view
                })
              }}
              eventMouseEnter={(info) => {
                const booking = info.event.extendedProps
                const startTime = new Date(info.event.start)
                const endTime = new Date(info.event.end)

                info.el.setAttribute('title',
                  `Guest: ${booking.guestName}\n` +
                  `Email: ${booking.guestEmail || 'N/A'}\n` +
                  `Phone: ${booking.guestPhone || 'N/A'}\n` +
                  `Treatment: ${booking.treatment?.name || 'N/A'}\n` +
                  `Therapist: ${booking.therapist?.name || 'N/A'}\n` +
                  `Room: ${booking.room?.name || 'N/A'}\n` +
                  `Time: ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
                  `Duration: ${booking.treatment?.duration || 0} minutes\n` +
                  `Status: ${booking.status}\n` +
                  `Notes: ${booking.notes || 'No notes'}`
                )
              }}
              viewDidMount={(info) => {
                setCurrentView(info.view.type)
                setCurrentDateRange({
                  start: info.view.activeStart,
                  end: info.view.activeEnd
                })
              }}
              datesSet={(info) => {
                setCurrentView(info.view.type)
                setCurrentDateRange({
                  start: info.view.activeStart,
                  end: info.view.activeEnd
                })
              }}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              slotDuration="00:30:00"
            />
          </div>
        )}
      </div>

      {/* Popover for Create/Edit */}
      {popover.isOpen && (
        <div
          className="fixed z-50"
          style={{
            left: `${popover.x}px`,
            top: `${popover.y - 10}px`,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-32">
            {popover.booking ? (
              <button
                onClick={() => handlePopoverAction('edit')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Booking
              </button>
            ) : (
              <button
                onClick={() => handlePopoverAction('create')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Booking
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Custom Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Custom Confirm Dialog */}
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

const BookingModal = ({ booking, treatments, therapists, rooms, setAlert, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    guest_name: booking?.guestName || '',
    guest_email: booking?.guestEmail || '',
    guest_phone: booking?.guestPhone || '',
    treatment_id: booking?.treatment?.id || '',
    therapist_id: booking?.therapist?.id || '',
    room_id: booking?.room?.id || '',
    appointment_date: booking?.start || '',
    appointment_time: booking?.startTime || '',
    duration: booking?.duration || '',
    notes: booking?.notes || '',
    status: booking?.status || 'tentative',
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

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            {booking?.id ? 'Edit Booking' : 'New Booking'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {conflicts.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Guest Information */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2">Guest Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter guest name"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Guest Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    placeholder="guest@email.com"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Guest Phone
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    placeholder="555-0100"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Treatment
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Therapist
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Room
                  </label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    required
                  >
                    <option value="tentative">⏸️ Tentative</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="completed">✓ Completed</option>
                    <option value="waiting_list">📋 Waiting List</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Appointment Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    placeholder={treatments.find(t => t.id === parseInt(formData.treatment_id))?.duration || 'Auto'}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              {formData.treatment_id && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Treatment duration:</span> {treatments.find(t => t.id === parseInt(formData.treatment_id))?.duration || 0} minutes
                        {formData.duration && (
                          <span className="ml-2">
                            • <span className="font-medium">Custom duration:</span> {formData.duration} minutes
                          </span>
                        )}
                        {formData.appointment_date && formData.appointment_time && (formData.duration || treatments.find(t => t.id === parseInt(formData.treatment_id))?.duration) && (
                          <span className="ml-2 block mt-1">
                            <span className="font-medium">Ends at:</span> {new Date(new Date(`${formData.appointment_date}T${formData.appointment_time}`).getTime() + (parseInt(formData.duration) || treatments.find(t => t.id === parseInt(formData.treatment_id))?.duration || 0) * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                rows="3"
                placeholder="Add any special requests or notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || conflicts.length > 0}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
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
