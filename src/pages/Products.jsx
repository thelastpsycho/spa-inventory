import { useState, useEffect } from 'react'
import { productAPI } from '../services/api'
import AlertDialog from '../components/AlertDialog'
import ConfirmDialog from '../components/ConfirmDialog'

const Products = () => {
  const [products, setProducts] = useState([])
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' })
  const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [showLowStockOnly])

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ low_stock: showLowStockOnly })
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, formData)
      } else {
        await productAPI.create(formData)
      }
      fetchProducts()
      setShowModal(false)
      setEditingProduct(null)
      setAlert({
        isOpen: true,
        title: 'Success',
        message: 'Product saved successfully',
        type: 'success'
      })
    } catch (error) {
      setAlert({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save product: ' + (error.response?.data?.message || error.message),
        type: 'error'
      })
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    setConfirm({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await productAPI.delete(id)
          fetchProducts()
          setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })
          setAlert({
            isOpen: true,
            title: 'Success',
            message: 'Product deleted successfully',
            type: 'success'
          })
        } catch (error) {
          setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })
          setAlert({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete product: ' + (error.response?.data?.message || error.message),
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

  const lowStockCount = products.filter(p => p.quantity <= p.reorder_level).length

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">Inventory Management</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage your spa supplies</p>
            {lowStockCount > 0 && (
              <div className="mt-3 inline-flex items-center bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
                <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium text-amber-900">{lowStockCount} products need restocking</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowModal(true)
            }}
            className="px-5 py-2.5 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
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

          {/* Filter Toggle */}
          <label className="flex items-center cursor-pointer px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="h-4 w-4 text-brand-900 focus:ring-2 focus:ring-brand-900 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Low stock only
            </span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isLowStock = product.quantity <= product.reorder_level
            const stockPercentage = Math.min((product.quantity / (product.reorder_level * 2)) * 100, 100)

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all ${
                  isLowStock ? 'border-amber-300' : 'border-gray-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 ${
                      isLowStock ? 'bg-amber-100' : 'bg-gray-50'
                    }`}>
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-brand-900 truncate text-base">{product.name}</h3>
                    </div>
                  </div>
                  {isLowStock && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 bg-amber-100 text-amber-700">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="space-y-2.5 mb-4">
                  {/* Stock Level Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Stock Level</span>
                      <span className={`text-sm font-bold ${
                        isLowStock ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Reorder at: {product.reorder_level} {product.unit}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {product.description && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600 pt-2">
                    <span>Cost:</span>
                    <span className="font-medium text-gray-900">
                      {product.cost ? `$${product.cost}` : '-'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end space-x-1 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-brand-900 hover:bg-gray-50 rounded-lg transition-all flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-4 text-sm text-gray-600">No products found matching "{searchQuery}"</p>
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
        <ProductModal
          product={editingProduct}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingProduct(null)
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

const ProductModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    quantity: product?.quantity || 0,
    unit: product?.unit || 'pcs',
    reorder_level: product?.reorder_level || 10,
    cost: product?.cost || '',
    is_active: product?.is_active ?? true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {product ? 'Update inventory item' : 'Add to inventory'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                placeholder="e.g., Massage Oil - Lavender"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                rows="2"
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pcs">Pieces</option>
                  <option value="ml">Milliliters</option>
                  <option value="gr">Grams</option>
                  <option value="kg">Kilograms</option>
                  <option value="L">Liters</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reorder Level *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  placeholder="10"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-900 focus:border-transparent transition-colors"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
                Active product
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Products
