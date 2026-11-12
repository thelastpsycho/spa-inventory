const AlertDialog = ({ isOpen, title, message, type = 'error', onClose }) => {
  if (!isOpen) return null

  const styles = {
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      buttonText: 'OK',
      buttonBg: 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      buttonText: 'OK',
      buttonBg: 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      buttonText: 'OK',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      buttonText: 'OK',
      buttonBg: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
    }
  }

  const currentStyle = styles[type] || styles.error

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-5 flex items-start">
          <div className={`${currentStyle.iconBg} rounded-full p-2 mr-4 flex-shrink-0`}>
            <svg className={`w-6 h-6 ${currentStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={currentStyle.iconPath} />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className={`px-5 py-2 ${currentStyle.buttonBg} text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            {currentStyle.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertDialog
