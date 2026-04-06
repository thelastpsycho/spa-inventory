import { useState, useEffect } from 'react'
import { statisticsAPI, bookingAPI } from '../services/api'

const Statistics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('mtd')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    fetchStatistics()
  }, [period])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const now = new Date()
      let startDate, endDate

      switch (period) {
        case 'today':
          startDate = endDate = now.toISOString().split('T')[0]
          break

        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = endDate = yesterday.toISOString().split('T')[0]
          break

        case 'this_week':
          const dayOfWeek = now.getDay()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - dayOfWeek)
          startDate = startOfWeek.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_week':
          const lastWeekEnd = new Date(now)
          lastWeekEnd.setDate(now.getDate() - dayOfWeek)
          const lastWeekStart = new Date(lastWeekEnd)
          lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
          startDate = lastWeekStart.toISOString().split('T')[0]
          endDate = lastWeekEnd.toISOString().split('T')[0]
          break

        case 'mtd':
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
          break

        case 'this_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_quarter':
          const lastQuarter = Math.floor((now.getMonth() - 3) / 3)
          const lastQuarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1)
          const lastQuarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
          startDate = lastQuarterStart.toISOString().split('T')[0]
          endDate = lastQuarterEnd.toISOString().split('T')[0]
          break

        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
          break

        case 'last_7_days':
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(now.getDate() - 7)
          startDate = sevenDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_30_days':
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(now.getDate() - 30)
          startDate = thirtyDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'last_90_days':
          const ninetyDaysAgo = new Date(now)
          ninetyDaysAgo.setDate(now.getDate() - 90)
          startDate = ninetyDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break

        case 'custom':
          if (!customStartDate || !customEndDate) {
            setLoading(false)
            return
          }
          startDate = customStartDate
          endDate = customEndDate
          break

        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
      }

      const response = await statisticsAPI.get({ start_date: startDate, end_date: endDate })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-brand-900"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const getPeriodLabel = () => {
    const labels = {
      today: 'Today',
      yesterday: 'Yesterday',
      this_week: 'This Week',
      last_week: 'Last Week',
      mtd: 'Month to Date',
      this_month: 'This Month',
      last_month: 'Last Month',
      this_quarter: 'This Quarter',
      last_quarter: 'Last Quarter',
      this_year: 'This Year',
      last_year: 'Last Year',
      last_7_days: 'Last 7 Days',
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days',
      custom: 'Custom Range'
    }
    return labels[period] || period
  }

  const exportToCSV = async () => {
    try {
      const now = new Date()
      let startDate, endDate

      switch (period) {
        case 'today':
          startDate = endDate = now.toISOString().split('T')[0]
          break
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          startDate = endDate = yesterday.toISOString().split('T')[0]
          break
        case 'this_week':
          const dayOfWeek = now.getDay()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - dayOfWeek)
          startDate = startOfWeek.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_week':
          const lastWeekEnd = new Date(now)
          lastWeekEnd.setDate(now.getDate() - dayOfWeek)
          const lastWeekStart = new Date(lastWeekEnd)
          lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
          startDate = lastWeekStart.toISOString().split('T')[0]
          endDate = lastWeekEnd.toISOString().split('T')[0]
          break
        case 'mtd':
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
          break
        case 'this_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_quarter':
          const lastQuarter = Math.floor((now.getMonth() - 3) / 3)
          const lastQuarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1)
          const lastQuarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0)
          startDate = lastQuarterStart.toISOString().split('T')[0]
          endDate = lastQuarterEnd.toISOString().split('T')[0]
          break
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
          endDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
          break
        case 'last_7_days':
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(now.getDate() - 7)
          startDate = sevenDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_30_days':
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(now.getDate() - 30)
          startDate = thirtyDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'last_90_days':
          const ninetyDaysAgo = new Date(now)
          ninetyDaysAgo.setDate(now.getDate() - 90)
          startDate = ninetyDaysAgo.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
          break
        case 'custom':
          if (!customStartDate || !customEndDate) {
            alert('Please select start and end dates')
            return
          }
          startDate = customStartDate
          endDate = customEndDate
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
      }

      // Fetch bookings for the selected period
      const response = await bookingAPI.getAll({
        start: startDate,
        end: endDate
      })

      const bookings = response.data

      if (!bookings || bookings.length === 0) {
        alert('No bookings found for the selected period')
        return
      }

      // Convert bookings to CSV format
      const csvHeaders = ['Date', 'Time', 'Guest Name', 'Guest Email', 'Guest Phone', 'Treatment', 'Therapist', 'Room', 'Duration (min)', 'Price ($)', 'Status', 'Notes']

      const csvRows = bookings.map(booking => {
        const bookingDate = new Date(booking.start_time)
        const timeStr = bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return [
          bookingDate.toLocaleDateString(),
          timeStr,
          booking.guest_name || '',
          booking.guest_email || '',
          booking.guest_phone || '',
          booking.treatment?.name || '',
          booking.therapist?.name || '',
          booking.room?.name || '',
          booking.treatment?.duration || booking.duration || '',
          booking.treatment?.price || '',
          booking.status || '',
          booking.notes || ''
        ]
      })

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const cellString = String(cell).replace(/"/g, '""')
          return cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')
            ? `"${cellString}"`
            : cellString
        }).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `spa-bookings-${startDate}-to-${endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">Statistics Report</h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{getPeriodLabel()}</span>
              <span className="mx-2">•</span>
              {stats.period.start_date} to {stats.period.end_date}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
            >
              <optgroup label="Quick Select">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
              </optgroup>
              <optgroup label="Weeks">
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
              </optgroup>
              <optgroup label="Months">
                <option value="mtd">MTD (Month to Date)</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
              </optgroup>
              <optgroup label="Quarters">
                <option value="this_quarter">This Quarter</option>
                <option value="last_quarter">Last Quarter</option>
              </optgroup>
              <optgroup label="Years">
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
              </optgroup>
              <optgroup label="Days Range">
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
              </optgroup>
              <optgroup label="Custom">
                <option value="custom">Custom Range</option>
              </optgroup>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>

            {period === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                />
                <button
                  onClick={fetchStatistics}
                  className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm hover:bg-brand-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-semibold text-brand-900 mt-1">{stats.overview.total_bookings}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.overview.definite_bookings} definite</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-brand-900 mt-1">{formatCurrency(stats.overview.total_revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(stats.overview.average_booking_value)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Treatment Hours</p>
              <p className="text-2xl font-semibold text-brand-900 mt-1">{formatHours(stats.overview.total_treatment_hours)}</p>
              <p className="text-xs text-gray-500 mt-1">Total duration</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-semibold text-brand-900 mt-1">{stats.overview.occupancy_rate}%</p>
              <p className="text-xs text-gray-500 mt-1">Capacity utilization</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Therapist Performance */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Therapist Performance</h2>
            <p className="text-sm text-gray-600 mt-1">Hours, bookings, and revenue per therapist</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Therapist</th>
                    <th className="pb-3 font-medium text-right">Bookings</th>
                    <th className="pb-3 font-medium text-right">Hours</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.therapist_performance.map((therapist, index) => (
                    <tr key={therapist.id} className="text-sm">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-brand-900 flex items-center justify-center text-white text-xs font-semibold mr-2">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{therapist.name}</p>
                            <p className="text-xs text-gray-500">{therapist.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-brand-900 text-white">
                          {therapist.total_bookings}
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-600">{formatHours(therapist.total_hours)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(therapist.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Treatment Popularity */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Treatment Popularity</h2>
            <p className="text-sm text-gray-600 mt-1">Most booked treatments and revenue</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.treatment_popularity.map((treatment, index) => (
                <div key={treatment.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-brand-900 flex items-center justify-center text-white text-xs font-semibold mr-2">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{treatment.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{treatment.total_bookings} bookings</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-900 h-2 rounded-full"
                        style={{ width: `${treatment.revenue_percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{treatment.duration} min • {formatCurrency(treatment.price)}</span>
                      <span className="text-xs font-medium text-gray-900">{formatCurrency(treatment.total_revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Room Utilization</h2>
            <p className="text-sm text-gray-600 mt-1">Booking frequency and occupancy</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.room_utilization.map((room) => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{room.name}</p>
                      <p className="text-xs text-gray-500">Capacity: {room.capacity} person(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-brand-900">{room.utilization_percentage}%</p>
                      <p className="text-xs text-gray-500">Utilization</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        room.utilization_percentage >= 80
                          ? 'bg-green-900'
                          : room.utilization_percentage >= 50
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(room.utilization_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span>{room.total_bookings} bookings</span>
                    <span>{formatHours(room.total_hours)} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Summary */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Resource Summary</h2>
            <p className="text-sm text-gray-600 mt-1">Current system resources</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-brand-900">{stats.resources.total_therapists}</p>
                <p className="text-sm text-gray-600 mt-1">Total Therapists</p>
                <p className="text-xs text-green-600 mt-1">{stats.resources.active_therapists} active</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-brand-900">{stats.resources.total_rooms}</p>
                <p className="text-sm text-gray-600 mt-1">Total Rooms</p>
                <p className="text-xs text-gray-500 mt-1">{stats.resources.total_capacity} capacity</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-brand-900">{stats.resources.total_treatments}</p>
                <p className="text-sm text-gray-600 mt-1">Treatments</p>
                <p className="text-xs text-green-600 mt-1">{stats.resources.active_treatments} active</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-brand-900">{stats.inventory.total_products}</p>
                <p className="text-sm text-gray-600 mt-1">Products</p>
                <p className={`text-xs mt-1 ${stats.inventory.low_stock_products > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.inventory.low_stock_products} low stock
                </p>
              </div>
            </div>

            <div className="mt-4 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Inventory Value</p>
                  <p className="text-xs text-gray-500 mt-1">Current stock value</p>
                </div>
                <p className="text-lg font-semibold text-brand-900">
                  {formatCurrency(stats.inventory.total_inventory_value)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-900">Booking Summary</h2>
          <p className="text-sm text-gray-600 mt-1">Booking status breakdown</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.overview.total_bookings}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Definite</p>
                  <p className="text-2xl font-semibold text-green-900 mt-1">{stats.overview.definite_bookings}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Tentative</p>
                  <p className="text-2xl font-semibold text-yellow-900 mt-1">{stats.overview.tentative_bookings}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Waiting List</p>
                  <p className="text-2xl font-semibold text-blue-900 mt-1">{stats.overview.waiting_list_bookings}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="border border-red-200 rounded-lg p-4 md:col-span-2 lg:col-span-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Cancelled</p>
                  <p className="text-2xl font-semibold text-red-900 mt-1">{stats.overview.cancelled_bookings}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics