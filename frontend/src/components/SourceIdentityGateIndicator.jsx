import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import {
  buildSourceIdentityGatePresentation
} from '../utils/sourceIdentityGatePresentation.js';

const toneClasses = {
  neutral: 'bg-slate-400',
  warning: 'bg-amber-400',
  success: 'bg-emerald-400',
  danger: 'bg-red-400'
};

function GateIcon({ tone }) {
  if (tone === 'success') {
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  }

  if (tone === 'warning' || tone === 'danger') {
    return <AlertCircle className={`h-4 w-4 ${
      tone === 'warning' ? 'text-amber-400' : 'text-red-400'
    }`} />;
  }

  return <HelpCircle className="h-4 w-4 text-slate-400" />;
}

export default function SourceIdentityGateIndicator({
  status,
  hasBetfairUrl,
  trackingStopped,
  onOpenConfirmation
}) {
  const presentation = buildSourceIdentityGatePresentation({
    status,
    hasBetfairUrl,
    trackingStopped
  });

  const interactive = presentation.canOpenConfirmation;

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GateIcon tone={presentation.tone} />
          <span className="text-xs font-semibold text-white">
            Source Identity
          </span>
        </div>

        <span
          className={`h-2.5 w-2.5 rounded-full ${
            toneClasses[presentation.tone]
          } ${presentation.tone === 'neutral' ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
      </div>

      <p className="mt-1.5 text-[11px] leading-4 text-[var(--muted)]">
        {presentation.trackingStopped
          ? 'Tracking fermo'
          : presentation.title === 'Source Identity'
            ? presentation.detail
            : presentation.title}
      </p>
    </>
  );

  if (!interactive) {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenConfirmation}
      className="w-full rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-left transition-colors hover:bg-amber-500/15"
      aria-label="Apri conferma Source Identity"
    >
      {content}
    </button>
  );
}
