import { getSourceIdentityControlMode } from '../../utils/sourceIdentityControlMode.js';

const SourceIdentityControls = ({
    sourceIdentityStatus,
    manualConfirmationApplied,
    pendingIdentityIncomplete,
    canConfirmIdentity,
    onOpenConfirmation,
    onRevoke,
    revoking,
    revokeError
}) => {
    const controlMode = getSourceIdentityControlMode({
        sourceIdentityStatus,
        manualConfirmationApplied,
        pendingIdentityIncomplete,
        canConfirmIdentity
    });

    if (controlMode === 'manual-confirmed') {
        return (
            <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                    <p className="text-sm text-[var(--muted)]">
                        {'Conferma manuale applicata per l\u2019epoch corrente.'}
                    </p>
                    <button
                        type="button"
                        onClick={onRevoke}
                        disabled={revoking}
                        className="shrink-0 rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs text-[var(--muted)] hover:text-white disabled:opacity-50"
                    >
                        {revoking
                            ? 'Revoca in corso' + '.' + '.' + '.'
                            : 'Revoca conferma'}
                    </button>
                </div>

                {revokeError && (
                    <div className="mt-4 rounded-2xl border border-red-900/50 p-4">
                        <p className="text-sm text-red-400">{revokeError}</p>
                    </div>
                )}
            </div>
        );
    }

    if (controlMode === 'pending-incomplete') {
        return (
            <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
                    <p className="text-sm text-[var(--muted)]">
                        {'L\u2019abbinamento delle fonti richiede dati completi prima di poter essere verificato.'}
                    </p>
                </div>
            </div>
        );
    }

    if (controlMode === 'confirm-available') {
        return (
            <div className="max-w-[1400px] w-full px-6 mt-6 mx-auto flex justify-end">
                <button
                    type="button"
                    onClick={onOpenConfirmation}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted)] hover:text-white"
                >
                    Verifica abbinamento
                </button>
            </div>
        );
    }

    return null;
};

export default SourceIdentityControls;