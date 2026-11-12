import { useState, useEffect } from 'react'
import { statisticsAPI, bookingAPI } from '../services/api'
import AlertDialog from '../components/AlertDialog'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Statistics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('mtd')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' })
  const [dailyData, setDailyData] = useState([])
  const [loadingDaily, setLoadingDaily] = useState(false)

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
            setAlert({
              isOpen: true,
              title: 'Validation Error',
              message: 'Please select start and end dates',
              type: 'warning'
            })
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

      // Fetch daily bookings for chart based on selected period
      await fetchDailyBookings(startDate, endDate)
    } catch (error) {
      console.error('Error fetching statistics:', error)
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load statistics. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyBookings = async (startDate, endDate) => {
    try {
      setLoadingDaily(true)

      const response = await bookingAPI.getAll({ start: startDate, end: endDate })
      const bookings = response.data

      // Create map for all dates in the selected period (including days with 0 bookings)
      const dailyMap = new Map()

      const start = new Date(startDate)
      const end = new Date(endDate)

      // Loop through each day in the range
      const current = new Date(start)
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        const displayDate = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        dailyMap.set(dateStr, {
          date: displayDate,
          bookings: 0,
          hours: 0
        })

        // Move to next day
        current.setDate(current.getDate() + 1)
      }

      // Aggregate bookings by date
      bookings.forEach(booking => {
        const date = new Date(booking.start_time).toISOString().split('T')[0]
        const duration = booking.treatment?.duration || 0

        if (dailyMap.has(date)) {
          const dayData = dailyMap.get(date)
          dayData.bookings += 1
          dayData.hours += duration / 60 // Convert minutes to hours
        }
      })

      // Convert map to array
      const dailyArray = Array.from(dailyMap.values())

      setDailyData(dailyArray)
    } catch (error) {
      console.error('Error fetching daily bookings:', error)
    } finally {
      setLoadingDaily(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatHours = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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
        case 'custom':
          if (!customStartDate || !customEndDate) {
            setAlert({
              isOpen: true,
              title: 'Validation Error',
              message: 'Please select start and end dates',
              type: 'warning'
            })
            return
          }
          startDate = customStartDate
          endDate = customEndDate
          break
        default:
          startDate = stats.period.start_date
          endDate = stats.period.end_date
      }

      const response = await bookingAPI.getAll({
        start: startDate,
        end: endDate
      })

      const bookings = response.data

      if (!bookings || bookings.length === 0) {
        setAlert({
          isOpen: true,
          title: 'No Data',
          message: 'No bookings found for the selected period',
          type: 'warning'
        })
        return
      }

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

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => {
          const cellString = String(cell).replace(/"/g, '""')
          return cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')
            ? `"${cellString}"`
            : cellString
        }).join(','))
      ].join('\n')

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
      setAlert({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
        type: 'error'
      })
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">Statistics Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-brand-900">{getPeriodLabel()}</span>
              <span className="mx-2 text-gray-400">•</span>
              {stats.period.start_date} to {stats.period.end_date}
            </p>
          </div>
        </div>

        {/* Period Selector & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
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
            className="flex items-center px-5 py-2.5 bg-brand-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors font-medium shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>

          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
              />
              <button
                onClick={fetchStatistics}
                className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-xl font-semibold text-brand-900 mt-1">{stats.overview.total_bookings}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.overview.confirmed_bookings || 0} confirmed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xl font-semibold text-brand-900 mt-1">{formatCurrency(stats.overview.total_revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Avg: {formatCurrency(stats.overview.average_booking_value)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Treatment Hours</p>
              <p className="text-xl font-semibold text-brand-900 mt-1">{formatHours(stats.overview.total_treatment_hours)}</p>
              <p className="text-xs text-gray-500 mt-1">Total duration</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Popular Treatment</p>
              <p className="text-lg font-semibold text-brand-900 mt-1 truncate">{stats.overview.most_popular_treatment?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.overview.most_popular_treatment?.count || 0} bookings</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-900">Daily Bookings & Treatment Hours</h2>
          <p className="text-sm text-gray-500 mt-1">Number of treatments and hours per day</p>
        </div>
        <div className="p-6">
          {loadingDaily ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-brand-900"></div>
            </div>
          ) : dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar
                  yAxisId="left"
                  dataKey="bookings"
                  name="Bookings"
                  fill="#111827"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">No daily data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Therapists */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Top Therapists</h2>
          </div>
          <div className="p-6">
            {stats.therapist_performance && stats.therapist_performance.length > 0 ? (
              <div className="space-y-4">
                {stats.therapist_performance
                  .sort((a, b) => b.total_hours - a.total_hours)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900 block truncate">{item.name || 'Unknown'}</span>
                          <p className="text-xs text-gray-500 truncate">{item.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-right ml-3">
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{item.total_bookings}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">{Math.round(item.total_hours * 60)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No therapist data available</p>
            )}
          </div>
        </div>

        {/* Popular Treatments */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-brand-900">Popular Treatments</h2>
          </div>
          <div className="p-6">
            {stats.treatment_popularity && stats.treatment_popularity.length > 0 ? (
              <div className="space-y-3">
                {stats.treatment_popularity
                  .slice(0, 5)
                  .map((treatment, index) => (
                    <div key={treatment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
                          index === 0 ? 'bg-brand-900' : 'bg-gray-200'
                        }`}>
                          <span className={`text-sm font-semibold ${index === 0 ? 'text-white' : 'text-gray-600'}`}>{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{treatment.name}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-right ml-3">
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{treatment.booking_count || 0}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">{formatCurrency(treatment.total_revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No treatment data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-900">Revenue Summary</h2>
        </div>
        <div className="p-6">
          {stats.treatment_popularity && stats.treatment_popularity.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                <span className="text-sm font-semibold text-brand-900">{formatCurrency(stats.overview.total_revenue)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-900">Average Booking Value</span>
                <span className="text-sm font-semibold text-brand-900">{formatCurrency(stats.overview.average_booking_value)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-900">Total Treatment Hours</span>
                <span className="text-sm font-semibold text-brand-900">{formatHours(stats.overview.total_treatment_hours)}</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Top Revenue Treatments</p>
                <div className="space-y-2">
                  {stats.treatment_popularity
                    .sort((a, b) => b.total_revenue - a.total_revenue)
                    .slice(0, 3)
                    .map((treatment, index) => (
                      <div key={treatment.id || index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{index + 1}. {treatment.name}</span>
                        <span className="font-semibold text-brand-900">{formatCurrency(treatment.total_revenue)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </div>
      </div>

      <AlertDialog
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ isOpen: false, title: '', message: '', type: 'error' })}
      />
    </div>
  )
}

export default Statistics
