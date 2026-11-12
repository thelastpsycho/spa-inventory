import { useState, useEffect } from 'react'
import { treatmentAPI } from '../services/api'
import AlertDialog from '../components/AlertDialog'
import ConfirmDialog from '../components/ConfirmDialog'

const Treatments = () => {
  const [treatments, setTreatments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' })
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      const response = await treatmentAPI.getAll()
      setTreatments(response.data)
    } catch (error) {
      console.error('Error fetching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingTreatment) {
        await treatmentAPI.update(editingTreatment.id, formData)
      } else {
        await treatmentAPI.create(formData)
      }
      fetchTreatments()
      setShowModal(false)
      setEditingTreatment(null)
      setAlert({
        isOpen: true,
        title: 'Success',
        message: 'Treatment saved successfully',
        type: 'success'
      })
    } catch (error) {
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save treatment: ' + (error.response?.data?.message || error.message),
        type: 'error'
      })
    }
  }

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    setConfirm({
      isOpen: true,
      title: 'Delete Treatment',
      message: 'Are you sure you want to delete this treatment? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await treatmentAPI.delete(id)
          fetchTreatments()
          setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })
          setAlert({
            isOpen: true,
            title: 'Success',
            message: 'Treatment deleted successfully',
            type: 'success'
          })
        } catch (error) {
          setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })
          setAlert({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete treatment: ' + (error.response?.data?.message || error.message),
            type: 'error'
          })
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-brand-900"></div>
      </div>
    )
  }

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (treatment.description && treatment.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">Treatments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your spa services</p>
          </div>
          <button
            onClick={() => {
              setEditingTreatment(null)
              setShowModal(true)
            }}
            className="px-5 py-2.5 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Treatment
          </button>
        </div>
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Treatments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTreatments.length > 0 ? (
          filteredTreatments.map((treatment) => (
          <div key={treatment.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-brand-900 truncate text-base">{treatment.name}</h3>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                treatment.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {treatment.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Card Body */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{treatment.duration} min</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${treatment.price}</span>
              </div>
              {treatment.description && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 line-clamp-2">{treatment.description}</p>
                </div>
              )}
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-end space-x-1 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(treatment)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-brand-900 hover:bg-gray-50 rounded-lg transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDelete(treatment.id)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-4 text-sm text-gray-600">No treatments found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-brand-900 hover:text-gray-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <TreatmentModal
          treatment={editingTreatment}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingTreatment(null)
          }}
        />
      )}

      <AlertDialog
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ isOpen: false, title: '', message: '', type: 'error' })}
      />

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => {
          if (confirm.onConfirm) confirm.onConfirm()
        }}
        onCancel={() => setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

const TreatmentModal = ({ treatment, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: treatment?.name || '',
    description: treatment?.description || '',
    duration: treatment?.duration || 60,
    price: treatment?.price || 0,
    is_active: treatment?.is_active ?? true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-900">
            {treatment ? 'Edit Treatment' : 'Add Treatment'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {treatment ? 'Update treatment details' : 'Add a new spa service'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                placeholder="e.g., Deep Tissue Massage"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                rows="3"
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-brand-900 focus:ring-2 focus:ring-brand-900 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">
                Active treatment
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Save Treatment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Treatments
