import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle, Wifi, Globe, Signal } from 'lucide-react';

// Network Issue Component
interface NetworkErrorAlertProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function NetworkErrorAlert({ isOpen = true, onClose }: NetworkErrorAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Lock body scroll when alert is shown
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  const checkConnection = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    setTimeout(() => {
      setIsRetrying(false);
      setLastChecked(new Date());
      setIsOnline(navigator.onLine);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">
      <div className="max-w-md w-full my-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
                <WifiOff className="w-12 h-12 text-orange-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            No Internet Connection
          </h1>

          {/* Description */}
          <p className="text-slate-600 mb-6">
            Your device is not connected to the internet. Please check your network settings and try again.
          </p>

          {/* Status Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600">Connection Status</span>
              <span className="flex items-center text-sm font-medium text-orange-600">
                <span className="w-2 h-2 bg-orange-600 rounded-full mr-2 animate-pulse"></span>
                Disconnected
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600">Error Type</span>
              <span className="text-sm text-slate-800 font-medium">Network Issue</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600">Browser Status</span>
              <span className="text-sm text-slate-800">
                {isOnline ? '✓ Online' : '✗ Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Checked</span>
              <span className="text-sm text-slate-800">
                {lastChecked.toLocaleTimeString()}
              </span>
            </div>
            {retryCount > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                <span className="text-sm text-slate-600">Retry Attempts</span>
                <span className="text-sm text-slate-800">{retryCount}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={checkConnection}
              disabled={isRetrying}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking Connection...' : 'Check Connection'}
            </button>
            <button
              onClick={() => onClose?.()}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Dismiss
            </button>
          </div>

          {/* Troubleshooting Steps */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3 font-medium flex items-center justify-center gap-2">
              <Signal className="w-4 h-4" />
              Troubleshooting Steps
            </p>
            <ul className="text-sm text-slate-700 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Check your WiFi or mobile data is turned on</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Verify airplane mode is off</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Restart your router or modem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Try connecting to a different network</span>
              </li>
            </ul>
          </div>

          {/* Detection Info */}
          {!isOnline && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg text-left border border-orange-200">
              <p className="text-xs text-orange-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Detected:</strong> Your browser reports no internet connection.
                  Please check your network settings.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-4 flex justify-center gap-6">
          <a
            href="#"
            className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
          >
            <Wifi className="w-4 h-4" />
            Network Help
          </a>
          <a
            href="#"
            className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Support
          </a>
        </div>
      </div>
    </div>
  );
}