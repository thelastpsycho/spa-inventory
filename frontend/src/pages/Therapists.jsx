import { useState, useEffect } from 'react'
import { therapistAPI } from '../services/api'

const Therapists = () => {
  const [therapists, setTherapists] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTherapist, setEditingTherapist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTherapists()
  }, [])

  const fetchTherapists = async () => {
    try {
      const response = await therapistAPI.getAll()
      setTherapists(response.data)
    } catch (error) {
      console.error('Error fetching therapists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingTherapist) {
        await therapistAPI.update(editingTherapist.id, formData)
      } else {
        await therapistAPI.create(formData)
      }
      fetchTherapists()
      setShowModal(false)
      setEditingTherapist(null)
    } catch (error) {
      alert('Failed to save therapist: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (therapist) => {
    setEditingTherapist(therapist)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this therapist?')) return

    try {
      await therapistAPI.delete(id)
      fetchTherapists()
    } catch (error) {
      alert('Failed to delete therapist: ' + (error.response?.data?.message || error.message))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-brand-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">Therapists</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your spa therapy team</p>
          </div>
          <button
            onClick={() => {
              setEditingTherapist(null)
              setShowModal(true)
            }}
            className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Therapist
          </button>
        </div>
      </div>

      {/* Therapists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapists.map((therapist) => (
          <div key={therapist.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
            {/* Card Header */}
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-brand-900 truncate">{therapist.name}</h3>
                    <p className="text-xs text-gray-500">Therapist</p>
                  </div>
                </div>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  therapist.is_active ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {therapist.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <div className="space-y-2">
                {therapist.email && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600 truncate">{therapist.email}</span>
                  </div>
                )}
                {therapist.phone && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600">{therapist.phone}</span>
                  </div>
                )}
                {therapist.notes && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 line-clamp-2">{therapist.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(therapist)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-900 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(therapist.id)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TherapistModal
          therapist={editingTherapist}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingTherapist(null)
          }}
        />
      )}
    </div>
  )
}

const TherapistModal = ({ therapist, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: therapist?.name || '',
    email: therapist?.email || '',
    phone: therapist?.phone || '',
    notes: therapist?.notes || '',
    is_active: therapist?.is_active ?? true,
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
            {therapist ? 'Edit Therapist' : 'Add Therapist'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {therapist ? 'Update therapist information' : 'Add a new team member'}
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
                placeholder="Therapist name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                placeholder="therapist@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                placeholder="555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                rows="3"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
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
                Active therapist
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
                Save Therapist
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Therapists
