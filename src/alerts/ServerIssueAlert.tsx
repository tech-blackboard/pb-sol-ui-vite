import { Activity, AlertCircle, CheckCircle, Globe, RefreshCw, Server } from "lucide-react";
import { useState } from "react";
export default function ServerIssueAlert() {
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [lastChecked, setLastChecked] = useState(new Date());
    const [estimatedTime] = useState('15-30 minutes');
  
    const checkServer = async () => {
      setIsRetrying(true);
      setRetryCount((prev: number) => prev + 1);
      
      setTimeout(() => {
        setIsRetrying(false);
        setLastChecked(new Date());
        // In real implementation, check actual server status
      }, 2000);
    };
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <Server className="w-12 h-12 text-red-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
  
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Server Unavailable
            </h1>
  
            {/* Description */}
            <p className="text-slate-600 mb-6">
              Our servers are currently experiencing issues. Our team has been notified and is working to resolve this.
            </p>
  
            {/* Status Info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Server Status</span>
                <span className="flex items-center text-sm font-medium text-red-600">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                  Down
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Error Type</span>
                <span className="text-sm text-slate-800 font-medium">Server-Side</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Estimated Fix</span>
                <span className="text-sm text-slate-800">{estimatedTime}</span>
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
  
            {/* Retry Button */}
            <button
              onClick={checkServer}
              disabled={isRetrying}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking Server...' : 'Retry Connection'}
            </button>
  
            {/* Troubleshooting Steps */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3 font-medium flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" />
                What You Can Do
              </p>
              <ul className="text-sm text-slate-700 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Wait a few minutes and try again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Check our status page for real-time updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Clear your browser cache and cookies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Contact support if the issue persists</span>
                </li>
              </ul>
            </div>
  
            {/* Important Notice */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left border border-blue-200">
              <p className="text-xs text-blue-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Good News:</strong> This is not an issue with your connection. 
                  We're working to restore service as quickly as possible.
                </span>
              </p>
            </div>
  
            {/* Team Status */}
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-left">
              <p className="text-xs text-slate-700 flex items-start gap-2">
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>
                  <strong>Team Status:</strong> Our engineers are actively working on the issue. 
                  Updates will be posted to our status page.
                </span>
              </p>
            </div>
          </div>
  
          {/* Footer Links */}
          <div className="mt-4 flex justify-center gap-6">
            <a
              href="#"
              className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Status Page
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
  
 