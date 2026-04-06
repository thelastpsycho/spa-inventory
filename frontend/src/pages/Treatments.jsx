import { useState, useEffect } from 'react'
import { treatmentAPI } from '../services/api'

const Treatments = () => {
  const [treatments, setTreatments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      alert('Failed to save treatment: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this treatment?')) return

    try {
      await treatmentAPI.delete(id)
      fetchTreatments()
    } catch (error) {
      alert('Failed to delete treatment: ' + (error.response?.data?.message || error.message))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Treatments</h1>
        <button
          onClick={() => {
            setEditingTreatment(null)
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Add Treatment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {treatments.map((treatment) => (
          <div key={treatment.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{treatment.name}</h3>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                treatment.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {treatment.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {treatment.duration} minutes
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${treatment.price}
              </div>
              {treatment.description && (
                <p className="text-sm text-gray-600 mt-2">{treatment.description}</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(treatment)}
                className="text-sm text-primary-600 hover:text-primary-900"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(treatment.id)}
                className="text-sm text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {treatment ? 'Edit Treatment' : 'Add Treatment'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input"
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
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Treatments
