import { useState } from 'react';
import { ShieldX, X, Mail, AlertTriangle } from 'lucide-react';

interface NoPermissionsAlertProps {
  isOpen?: boolean;
  onClose?: () => void;
  message?: string;
}

export default function NoPermissionsAlert({ isOpen = true, onClose, message }: NoPermissionsAlertProps) {
  const [isVisible, setIsVisible] = useState(isOpen)

  if (!isVisible && !isOpen) return null
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <ShieldX className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{message || 'No Permissions Assigned'}</h2>
          <p className="text-gray-600 leading-relaxed">
            {message ? 'Please contact support or try again.' : "Your account doesn't have permissions to access this resource. Please contact your administrator."}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-900 font-medium mb-1">Access Restricted</p>
              <p className="text-amber-800">You need proper permissions to view or modify this content.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            Request Access
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}