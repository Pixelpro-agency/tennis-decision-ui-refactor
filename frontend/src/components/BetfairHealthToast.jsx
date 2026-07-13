import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const BetfairHealthToast = ({ visible, health, onDismiss }) => {
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => {
            onDismiss();
        }, 8000);
        return () => clearTimeout(timer);
    }, [visible, onDismiss]);

    if (!visible || !health) return null;

    const isGraphLogin = health.metrics?.graphLoginRequired === true;
    const title = isGraphLogin ? "BETFAIR LOGOUT DETECTED" : "BETFAIR ALERT";
    const subtitle = isGraphLogin 
        ? (health.metrics.graphLoginRequiredText || "Devi effettuare l'accesso per visualizzare il grafico del mercato")
        : (health.message || "Betfair login/session lost or data stale");

    return (
        <div className="fixed top-20 right-6 z-[9999] w-[420px] max-w-[calc(100vw-2rem)] pointer-events-auto">
            <div className="bg-red-950/95 border border-red-400/70 text-red-400 p-5 rounded-xl shadow-2xl shadow-red-950/60 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 animate-bounce" />
                        <div>
                            <p className="text-base font-bold uppercase tracking-wider">{title}</p>
                            <p className="text-xs mt-1.5 font-semibold text-red-200">{subtitle}</p>
                            {health.message && health.message !== subtitle && (
                                <p className="text-[10px] mt-1.5 opacity-80 italic">{health.message}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-red-400 hover:text-white transition-colors"
                        aria-label="Dismiss alert"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BetfairHealthToast;
