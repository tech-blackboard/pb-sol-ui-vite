import React from 'react';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

interface AlertBannerProps {
    type: AlertType;
    message: string;
    onClose?: () => void;
    className?: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onClose, className = '' }) => {
    const styles = {
        error: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-300',
            icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-800 dark:text-yellow-300',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-300',
            icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        },
        success: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-800 dark:text-green-300',
            icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
        },
    };

    const { bg, border, text, icon } = styles[type];

    return (
        <div className={`${bg} ${border} ${text} ${className} border px-4 py-3 rounded-xl relative flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200`}>
            <div className="flex-shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 text-sm font-medium">
                {message}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    aria-label="Close alert"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default AlertBanner;
