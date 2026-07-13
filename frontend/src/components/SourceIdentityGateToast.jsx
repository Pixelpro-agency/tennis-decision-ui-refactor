import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const toneStyles = {
  success: {
    border: 'border-emerald-400/70',
    icon: 'text-emerald-400',
    panel: 'bg-emerald-950/95',
    Icon: CheckCircle2
  },
  danger: {
    border: 'border-red-400/70',
    icon: 'text-red-400',
    panel: 'bg-red-950/95',
    Icon: AlertTriangle
  }
};

export default function SourceIdentityGateToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast || toast.tone !== 'success') {
      return undefined;
    }

    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  const style = toneStyles[toast.tone] || toneStyles.danger;
  const Icon = style.Icon;

  return (
    <div className="fixed right-6 top-20 z-[9999] w-[420px] max-w-[calc(100vw-2rem)]">
      <div className={`${style.panel} ${style.border} rounded-xl border p-5 text-white shadow-2xl backdrop-blur-md`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.icon}`} />
            <div>
              <p className="text-base font-bold uppercase tracking-wider">
                {toast.title}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-slate-200">
                {toast.detail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className={`${style.icon} transition-colors hover:text-white`}
            aria-label="Chiudi avviso Source Identity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
