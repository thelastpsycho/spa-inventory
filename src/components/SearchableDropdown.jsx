import { useState, useRef, useEffect } from 'react'

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  displayField = 'name',
  subtitleField = null,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Find selected option
  const selectedOption = options.find(option => option.id === parseInt(value))

  // Format subtitle based on field name
  const formatSubtitle = (option) => {
    if (!subtitleField || !option[subtitleField]) return ''

    if (subtitleField === 'duration') {
      return `${option[subtitleField]} min`
    }

    if (subtitleField === 'capacity') {
      return `${option[subtitleField]} people`
    }

    return option[subtitleField]
  }

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const searchValue = searchTerm.toLowerCase()
    const name = option[displayField]?.toLowerCase() || ''
    const subtitle = formatSubtitle(option).toLowerCase()

    return name.includes(searchValue) || subtitle.includes(searchValue)
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option) => {
    onChange(option.id.toString())
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const displayText = selectedOption ? selectedOption[displayField] : ''

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : displayText}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 pr-8 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  option.id === parseInt(value) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option[displayField]}</div>
                    {formatSubtitle(option) && (
                      <div className="text-xs text-gray-500 mt-0.5">{formatSubtitle(option)}</div>
                    )}
                  </div>
                  {option.price && (
                    <div className="text-sm font-semibold text-gray-900 ml-3">
                      ${option.price}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
