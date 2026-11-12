import { supabase } from '../lib/supabaseClient'

// Keep the old axios-shaped contract (`response.data`, thrown errors with
// `error.response.data.message`) so pages written against the Laravel API
// don't need to change their call sites.
const unwrap = ({ data, error }) => {
  if (error) {
    const err = new Error(error.message)
    err.response = { data: { message: error.message } }
    throw err
  }
  return { data }
}

// Postgres rejects '' for integer/numeric columns (Laravel's validator was
// more forgiving), so empty-string fields are dropped before hitting the DB.
const sanitize = (data) => {
  const clean = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== '' && value !== undefined) {
      clean[key] = value
    }
  }
  return clean
}

const BOOKING_SELECT = '*, treatment:treatments(*), therapist:therapists(*), room:rooms(*)'

export const authAPI = {
  me: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return unwrap({ data: null, error: authError || new Error('Not authenticated') })
    }
    const result = await supabase.from('profiles').select('*').eq('id', auth.user.id).single()
    return unwrap({
      data: result.data ? { ...result.data, email: auth.user.email } : null,
      error: result.error,
    })
  },
}

export const bookingAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('bookings').select(BOOKING_SELECT).is('deleted_at', null)

    if (params.include_cancelled !== 'true') {
      query = query.neq('status', 'cancelled')
    }
    if (params.start && params.end) {
      const endOfDay = params.end.length === 10 ? `${params.end}T23:59:59` : params.end
      query = query.gte('start_time', params.start).lte('start_time', endOfDay)
    }
    if (params.therapist_id) query = query.eq('therapist_id', params.therapist_id)
    if (params.room_id) query = query.eq('room_id', params.room_id)
    if (params.treatment_id) query = query.eq('treatment_id', params.treatment_id)
    if (params.search) {
      query = query.or(
        `guest_name.ilike.%${params.search}%,guest_phone.ilike.%${params.search}%,guest_email.ilike.%${params.search}%`
      )
    }

    const result = await query.order('start_time')
    return unwrap(result)
  },
  get: async (id) => {
    const result = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', id).single()
    return unwrap(result)
  },
  create: async (data) => {
    const result = await supabase
      .from('bookings')
      .insert(sanitize(data))
      .select(BOOKING_SELECT)
      .single()
    return unwrap(result)
  },
  update: async (id, data) => {
    const result = await supabase
      .from('bookings')
      .update(sanitize(data))
      .eq('id', id)
      .select(BOOKING_SELECT)
      .single()
    return unwrap(result)
  },
  delete: async (id) => {
    const result = await supabase.rpc('delete_booking', { p_booking_id: id })
    return unwrap({ data: { message: 'Booking deleted successfully' }, error: result.error })
  },
  checkConflicts: async (params) => {
    const result = await supabase.rpc('check_booking_conflicts', {
      p_therapist_id: params.therapist_id || null,
      p_room_id: params.room_id || null,
      p_start_time: params.start_time || null,
      p_end_time: params.end_time || null,
      p_exclude_booking_id: params.exclude_booking_id || null,
    })
    const conflicts = result.data || []
    return unwrap({
      data: { has_conflicts: conflicts.length > 0, conflicts },
      error: result.error,
    })
  },
}

const makeResourceAPI = (table) => ({
  getAll: async () => {
    const result = await supabase
      .from(table)
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('created_at')
    return unwrap(result)
  },
  get: async (id) => {
    const result = await supabase.from(table).select('*').eq('id', id).single()
    return unwrap(result)
  },
  create: async (data) => {
    const result = await supabase.from(table).insert(sanitize(data)).select().single()
    return unwrap(result)
  },
  update: async (id, data) => {
    const result = await supabase.from(table).update(sanitize(data)).eq('id', id).select().single()
    return unwrap(result)
  },
  delete: async (id) => {
    const result = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    return unwrap({ data: { message: 'Deleted successfully' }, error: result.error })
  },
})

export const therapistAPI = makeResourceAPI('therapists')
export const roomAPI = makeResourceAPI('rooms')
export const treatmentAPI = makeResourceAPI('treatments')

const productResourceAPI = makeResourceAPI('products')
export const productAPI = {
  ...productResourceAPI,
  getAll: async (params = {}) => {
    const result = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('created_at')
    const { data } = unwrap(result)
    if (params.low_stock === true || params.low_stock === 'true') {
      return { data: data.filter((p) => p.quantity <= p.reorder_level) }
    }
    return { data }
  },
}

export const statisticsAPI = {
  get: async (params = {}) => {
    const result = await supabase.rpc('get_statistics', {
      p_start_date: params.start_date || null,
      p_end_date: params.end_date || null,
    })
    return unwrap(result)
  },
}
