import { X, AlertCircle } from 'lucide-react'

interface AlertProps {
    message: string
    onClose: () => void
    type?: 'error' | 'warning' | 'info'
}

export default function Alert({ message, onClose, type = 'error' }: AlertProps) {
    const bgColors = {
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    }

    const textColors = {
        error: 'text-red-800 dark:text-red-200',
        warning: 'text-amber-800 dark:text-amber-200',
        info: 'text-blue-800 dark:text-blue-200',
    }

    const iconColors = {
        error: 'text-red-400 dark:text-red-500',
        warning: 'text-amber-400 dark:text-amber-500',
        info: 'text-blue-400 dark:text-blue-500',
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${bgColors[type]} ${textColors[type]} animate-in fade-in slide-in-from-top-2 duration-300`}>
            <AlertCircle className={`h-5 w-5 shrink-0 ${iconColors[type]}`} />
            <span className="flex-1 text-sm font-medium">{message}</span>
            <button
                onClick={onClose}
                className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                aria-label="Close alert"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
