import React, { useEffect, useMemo, useState } from 'react';

const CONFIRMATION_PHRASE =
    'Confermo che questo mercato Betfair corrisponde alla partita SofaScore mostrata.';

function asStringArray(value) {
    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string' && item.trim())
        : [];
}

export default function SourceIdentityConfirmationModal({
    sourceIdentity,
    onConfirm,
    onDecline
}) {
    const sofaPlayers = asStringArray(sourceIdentity?.sofaPlayers);
    const betfairRunners = asStringArray(sourceIdentity?.betfairRunners);
    const reasons = asStringArray(sourceIdentity?.reasons);
    const sourceNamesKey = `${sofaPlayers.join('\u0001')}\u0002${betfairRunners.join('\u0001')}`;

    const [selectedRunners, setSelectedRunners] = useState(['', '']);
    const [confirmationText, setConfirmationText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [requestError, setRequestError] = useState(null);

    useEffect(() => {
        setSelectedRunners(['', '']);
        setConfirmationText('');
        setRequestError(null);
        setSubmitting(false);
    }, [sourceNamesKey]);

    const selectedPairs = useMemo(() => (
        sofaPlayers.map((sofaPlayer, index) => ({
            sofaPlayer,
            betfairRunner: selectedRunners[index] || ''
        }))
    ), [selectedRunners, sofaPlayers]);

    const mappingComplete =
        selectedPairs.length === 2 &&
        selectedPairs.every(pair => pair.sofaPlayer && pair.betfairRunner) &&
        new Set(selectedPairs.map(pair => pair.sofaPlayer)).size === 2 &&
        new Set(selectedPairs.map(pair => pair.betfairRunner)).size === 2;

    const canSubmit =
        mappingComplete &&
        confirmationText === CONFIRMATION_PHRASE &&
        !submitting;

    function updateRunner(index, runner) {
        setRequestError(null);
        setSelectedRunners(current => current.map((value, currentIndex) => (
            currentIndex === index ? runner : value
        )));
    }

    async function submitConfirmation() {
        if (!canSubmit) {
            return;
        }

        setSubmitting(true);
        setRequestError(null);

        try {
            const result = await onConfirm(selectedPairs, confirmationText);

            if (!result?.ok) {
                setRequestError(result?.error || 'Unable to confirm source identity.');
            }
        } catch (_) {
            setRequestError('Unable to confirm source identity.');
        } finally {
            setSubmitting(false);
        }
    }

    async function declineConfirmation() {
        if (submitting) {
            return;
        }

        setSubmitting(true);
        setRequestError(null);

        try {
            const result = await onDecline();

            if (!result?.ok) {
                setRequestError(result?.error || 'Unable to stop live tracking.');
            }
        } catch (_) {
            setRequestError('Unable to stop live tracking.');
        } finally {
            setSubmitting(false);
        }
    }

    if (
        sourceIdentity?.status !== 'pending' ||
        sofaPlayers.length !== 2 ||
        betfairRunners.length !== 2
    ) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-identity-confirmation-title"
        >
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl">
                <div>
                    <h3 id="source-identity-confirmation-title" className="text-lg font-bold text-white">
                        Verifica abbinamento fonti
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Associa ciascun giocatore SofaScore al runner Betfair corrispondente.
                    </p>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-[var(--card-border)]">
                                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                    SofaScore
                                </th>
                                <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                    Betfair
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sofaPlayers.map((sofaPlayer, index) => (
                                <tr key={sofaPlayer} className="border-b border-[var(--card-border)] last:border-0">
                                    <td className="py-3 pr-4 align-top">
                                        <p className="text-sm font-medium text-white">{sofaPlayer}</p>
                                    </td>
                                    <td className="py-3 align-top">
                                        <select
                                            value={selectedRunners[index]}
                                            onChange={event => updateRunner(index, event.target.value)}
                                            disabled={submitting}
                                            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-0)] px-3 py-2 text-sm text-white outline-none disabled:opacity-60"
                                        >
                                            <option value="">Seleziona runner Betfair</option>
                                            {betfairRunners.map(runner => {
                                                const selectedElsewhere = selectedRunners.some(
                                                    (selectedRunner, selectedIndex) => (
                                                        selectedIndex !== index &&
                                                        selectedRunner === runner
                                                    )
                                                );

                                                return (
                                                    <option
                                                        key={runner}
                                                        value={runner}
                                                        disabled={selectedElsewhere}
                                                    >
                                                        {runner}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {reasons.length > 0 && (
                    <div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--bg-0)] p-3">
                        <p className="text-xs font-medium text-[var(--muted)]">Motivi indicati dal backend</p>
                        <ul className="mt-1 space-y-1">
                            {reasons.map(reason => (
                                <li key={reason} className="text-xs text-[var(--muted)]">
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-4">
                    <p className="text-xs text-[var(--muted)]">Digita esattamente:</p>
                    <p className="mt-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-0)] p-3 text-sm text-white">
                        {CONFIRMATION_PHRASE}
                    </p>
                    <input
                        value={confirmationText}
                        onChange={event => {
                            setConfirmationText(event.target.value);
                            setRequestError(null);
                        }}
                        disabled={submitting}
                        aria-label="Frase di conferma"
                        className="mt-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-0)] px-3 py-2 text-sm text-white outline-none disabled:opacity-60"
                    />
                </div>

                {requestError && (
                    <p className="mt-3 text-sm text-red-400">{requestError}</p>
                )}

                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={declineConfirmation}
                        disabled={submitting}
                        className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white disabled:opacity-50"
                    >
                        I runner non sono corretti
                    </button>
                    <button
                        type="button"
                        onClick={submitConfirmation}
                        disabled={!canSubmit}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? 'Conferma in corso…' : 'Conferma abbinamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
