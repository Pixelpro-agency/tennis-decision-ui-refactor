import { AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function SourceIdentityGateWaitingScreen({
  presentation,
  onReturnToLinks
}) {
  const isBootstrapError = presentation?.hasBootstrapError === true;
  const isPending = presentation?.isPending === true;

  const title = isBootstrapError
    ? 'Registrazione non avviata'
    : isPending
      ? 'Conferma richiesta'
      : 'Verifico le fonti';

  const detail = isBootstrapError
    ? presentation.detail
    : isPending
      ? 'Controlla i giocatori e i runner nella modale.'
      : 'Attendo i primi aggiornamenti di SofaScore e Betfair.';

  const Icon = isBootstrapError
    ? AlertTriangle
    : isPending
      ? AlertCircle
      : Loader2;

  const iconClassName = isBootstrapError
    ? 'text-red-400'
    : isPending
      ? 'text-amber-400'
      : 'animate-spin text-slate-400';

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-1 items-center justify-center p-8">
      <div className="dashboardCard w-full max-w-xl p-8 text-center">
        <Icon className={`mx-auto h-10 w-10 ${iconClassName}`} />
        <h1 className="mt-5 text-2xl font-bold text-white">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
          {detail}
        </p>

        {isBootstrapError && (
          <button
            type="button"
            onClick={onReturnToLinks}
            className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-slate-200"
          >
            Torna ai link
          </button>
        )}
      </div>
    </div>
  );
}
