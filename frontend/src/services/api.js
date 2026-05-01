import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Log outgoing requests
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.baseURL + config.url,
    headers: config.headers,
    data: config.data,
    params: config.params,
    timestamp: new Date().toISOString()
  })

  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
      timestamp: new Date().toISOString()
    })
    return response
  },
  (error) => {
    // Log errors
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      requestData: error.config?.data,
      responseData: error.response?.data,
      timestamp: new Date().toISOString()
    })

    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - redirecting to login')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
}

export const bookingAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),
  checkConflicts: (params) => api.get('/bookings/conflicts/check', { params }),
}

export const therapistAPI = {
  getAll: () => api.get('/therapists'),
  get: (id) => api.get(`/therapists/${id}`),
  create: (data) => api.post('/therapists', data),
  update: (id, data) => api.put(`/therapists/${id}`, data),
  delete: (id) => api.delete(`/therapists/${id}`),
}

export const roomAPI = {
  getAll: () => api.get('/rooms'),
  get: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
}

export const treatmentAPI = {
  getAll: () => api.get('/treatments'),
  get: (id) => api.get(`/treatments/${id}`),
  create: (data) => api.post('/treatments', data),
  update: (id, data) => api.put(`/treatments/${id}`, data),
  delete: (id) => api.delete(`/treatments/${id}`),
}

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

export const statisticsAPI = {
  get: (params) => api.get('/statistics', { params }),
}

export default api
