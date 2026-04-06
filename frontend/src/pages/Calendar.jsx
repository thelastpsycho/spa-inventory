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
    case 'definite': return '#22c55e' // green
    case 'tentative': return '#f59e0b' // yellow
    case 'waiting_list': return '#3b82f6' // blue
    case 'cancelled': return '#ef4444' // red
    default: return '#007AFF'
  }
}

const getStatusBorderColor = (status) => {
  switch (status) {
    case 'definite': return '#16a34a' // dark green
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

  // Alert and Confirm Dialog states
  const [alert, setAlert] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

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
      const events = response.data.map((booking) => ({
        id: booking.id,
        resourceId: booking.room_id.toString(),
        title: `${booking.guest_name} - ${booking.treatment.name}`,
        start: booking.start_time.replace('.000000Z', 'Z'),
        end: booking.end_time.replace('.000000Z', 'Z'),
        backgroundColor: getStatusColor(booking.status),
        borderColor: getStatusBorderColor(booking.status),
        extendedProps: {
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
      }))
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

  const handleDateSelect = async (selectInfo) => {
    setShowModal(true)
    const startDate = new Date(selectInfo.startStr)
    setSelectedBooking({
      start: startDate.toISOString().split('T')[0], // Date portion
      startTime: startDate.toTimeString().substring(0, 5), // Time portion
    })
  }

  const handleEventClick = (clickInfo) => {
    const startDate = new Date(clickInfo.event.startStr)
    setSelectedBooking({
      id: clickInfo.event.id,
      ...clickInfo.event.extendedProps,
      start: startDate.toISOString().split('T')[0], // Date portion
      startTime: startDate.toTimeString().substring(0, 5), // Time portion
    })
    setShowModal(true)
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
      <div className="bg-white border border-gray-100 rounded-lg px-6 py-4">
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
                  color: #000000;
                  font-size: 0.875rem;
                  padding: 0.5rem;
                }
                .fc-timegrid-slot-label {
                  font-size: 0.75rem;
                  color: #8e8e93;
                  font-weight: 400;
                }
                .fc-event {
                  border: none;
                  border-radius: 6px;
                  padding: 3px 8px;
                  font-size: 0.8125rem;
                  font-weight: 500;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
                  cursor: pointer;
                  transition: all 0.15s ease-in-out;
                  color: #ffffff;
                }
                .fc-event:hover {
                  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
                  transform: translateY(-1px);
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
                  background-color: #f5f5f7;
                }
                .fc-resource-area {
                  width: 140px;
                }
                .fc-resource-area-col {
                  width: 140px;
                }
                .fc-datagrid-cell {
                  padding: 8px 12px;
                  border-right: 1px solid rgba(0, 0, 0, 0.06);
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
                }
                .fc-scrollgrid-shrink {
                  width: 50px;
                }
                .fc-timegrid-axis {
                  width: 50px;
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            {booking?.id ? 'Edit Booking' : 'New Booking'}
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            {booking?.id ? 'Update booking details' : 'Create a new appointment'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {conflicts.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-red-900 text-sm">Scheduling conflicts detected:</p>
                  <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
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
              <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">Guest Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
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
                    <option value="definite">✅ Definite</option>
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
