import { useState, useEffect } from 'react'
import { ServerOff, RefreshCw, AlertTriangle, Settings, HelpCircle } from 'lucide-react'

interface ServerUnavailableAlertProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ServerUnavailableAlert({ isOpen = true, onClose }: ServerUnavailableAlertProps) {
  if (!isOpen) return null;
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleRetry = () => {
    setIsRetrying(true)
    setRetryCount((prev) => prev + 1)
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
      <div className="max-w-md w-full my-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <ServerOff className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Server Unavailable
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to connect to the server. The server may be stopped, restarting, or temporarily unavailable.
          </p>

          {/* Status Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Connection Status</span>
              <span className="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                Unreachable
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Error Type</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">Connection Refused</span>
            </div>
            {retryCount > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Retry Attempts</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{retryCount}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Connection'}
            </button>
            <button
              onClick={() => onClose?.()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Dismiss
            </button>
          </div>

          {/* Troubleshooting Steps */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Possible Causes
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>The server is stopped or restarting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Server maintenance is in progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Incorrect server URL or port</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Firewall blocking the connection</span>
              </li>
            </ul>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Note:</strong> If you're a developer, check that your backend server is running on the correct port.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}