import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorBanner({ message, onRetry }) {
    if (!message) return null;

    return (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center justify-between shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{message}</span>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-bold uppercase tracking-wider transition"
                >
                    <RefreshCw className="w-3 h-3" /> Retry
                </button>
            )}
        </div>
    );
}
