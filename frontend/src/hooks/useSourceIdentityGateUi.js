import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { confirmSourceIdentityGate } from '../services/liveSessionApi.js';
import { buildSourceIdentityGatePresentation } from '../utils/sourceIdentityGatePresentation.js';

function buildPendingIdentityKey({
    canOpenConfirmation,
    sofaEventId,
    sourceIdentity
}) {
    if (!canOpenConfirmation) {
        return '';
    }

    const sofaPlayers = Array.isArray(sourceIdentity?.sofaPlayers)
        ? sourceIdentity.sofaPlayers
        : [];
    const betfairRunners = Array.isArray(sourceIdentity?.betfairRunners)
        ? sourceIdentity.betfairRunners
        : [];

    return [
        sofaEventId,
        ...sofaPlayers,
        '::',
        ...betfairRunners
    ].join('\u0001');
}

export function isRecordingAlignedForSession(status, trackingSessionId) {
    return Boolean(
        trackingSessionId &&
        status?.phase === 'recording' &&
        status?.sourceIdentity?.status === 'aligned' &&
        status?.trackingSessionId === trackingSessionId
    );
}

export function useSourceIdentityGateUi({
    sourceIdentityGate,
    sofaEventId,
    hasBetfairUrl,
    trackingStopped,
    sessionShellVisible,
    stopSofaPolling,
    clearConfirmedSession,
    setSessionShellVisible,
    setSessionActive,
    setTrackingSessionId,
    setActiveView,
    setTrackingStopped,
    resetDashboardBootstrap
}) {
    const [sourceIdentityToast, setSourceIdentityToast] = useState(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const previousGatePhaseRef = useRef(null);
    const acknowledgedPendingKeyRef = useRef(null);

    const sourceIdentityStatusForUi = useMemo(() => (
        sourceIdentityGate.error
            ? { error: sourceIdentityGate.error }
            : sourceIdentityGate.status
    ), [sourceIdentityGate.error, sourceIdentityGate.status]);

    const sourceIdentityPresentation = useMemo(() => (
        buildSourceIdentityGatePresentation({
            status: sourceIdentityStatusForUi,
            hasBetfairUrl,
            trackingStopped
        })
    ), [hasBetfairUrl, sourceIdentityStatusForUi, trackingStopped]);

    const sourceIdentity = sourceIdentityStatusForUi?.sourceIdentity ?? null;
    const pendingIdentityKey = useMemo(() => buildPendingIdentityKey({
        canOpenConfirmation: sourceIdentityPresentation.canOpenConfirmation,
        sofaEventId,
        sourceIdentity
    }), [
        sofaEventId,
        sourceIdentity,
        sourceIdentityPresentation.canOpenConfirmation
    ]);

    useEffect(() => {
        if (!pendingIdentityKey) {
            acknowledgedPendingKeyRef.current = null;
            setConfirmationOpen(false);
            return;
        }

        if (acknowledgedPendingKeyRef.current !== pendingIdentityKey) {
            setConfirmationOpen(true);
        }
    }, [pendingIdentityKey]);

    useEffect(() => {
        if (!sessionShellVisible) {
            return;
        }

        const phase = sourceIdentityStatusForUi?.phase ?? null;
        const isRecordingAligned = (
            phase === 'recording' &&
            sourceIdentityStatusForUi?.sourceIdentity?.status === 'aligned'
        );

        if (
            isRecordingAligned &&
            previousGatePhaseRef.current !== 'recording'
        ) {
            setSourceIdentityToast({
                tone: 'success',
                title: 'Fonti allineate',
                detail: 'Registrazione live avviata.'
            });
        }

        if (
            phase === 'mismatch' &&
            previousGatePhaseRef.current !== 'mismatch'
        ) {
            setSourceIdentityToast({
                tone: 'danger',
                title: 'Fonti non corrispondono',
                detail: 'Correggi i link e avvia di nuovo l\u2019analisi.'
            });
            stopSofaPolling();
            clearConfirmedSession();
            setSessionActive(false);
            setTrackingSessionId(null);
            setConfirmationOpen(false);
            setSessionShellVisible(false);
            setActiveView('overview');
            setTrackingStopped(false);
            resetDashboardBootstrap();
        }

        if (phase) {
            previousGatePhaseRef.current = phase;
        }
    }, [
        clearConfirmedSession,
        resetDashboardBootstrap,
        sessionShellVisible,
        setActiveView,
        setSessionShellVisible,
        setSessionActive,
        setTrackingSessionId,
        setTrackingStopped,
        sourceIdentityStatusForUi,
        stopSofaPolling
    ]);

    const dismissSourceIdentityToast = useCallback(() => {
        setSourceIdentityToast(null);
    }, []);

    const resetSourceIdentityUi = useCallback(() => {
        previousGatePhaseRef.current = null;
        acknowledgedPendingKeyRef.current = null;
        setSourceIdentityToast(null);
        setConfirmationOpen(false);
    }, []);

    const closeSourceIdentityConfirmation = useCallback(() => {
        setConfirmationOpen(false);
    }, []);

    const handleConfirmSourceIdentity = useCallback(async (
        selectedPairs,
        confirmationText
    ) => {
        if (!sofaEventId) {
            return {
                ok: false,
                error: 'Unable to confirm source identity.'
            };
        }

        try {
            const payload = await confirmSourceIdentityGate(sofaEventId, {
                selectedPairs,
                confirmationText,
                trackingSessionId: sourceIdentityStatusForUi?.trackingSessionId
            });

            if (payload?.ok !== true) {
                return {
                    ok: false,
                    error: 'Unable to confirm source identity.'
                };
            }

            const refreshedStatus = await sourceIdentityGate.refresh();
            const isRecordingAligned = isRecordingAlignedForSession(
                refreshedStatus,
                sourceIdentityStatusForUi?.trackingSessionId
            );

            if (!isRecordingAligned) {
                return {
                    ok: false,
                    error: 'Confirmation is still pending verification.'
                };
            }

            acknowledgedPendingKeyRef.current = pendingIdentityKey;
            setConfirmationOpen(false);

            return { ok: true };
        } catch (_) {
            return {
                ok: false,
                error: 'Unable to confirm source identity.'
            };
        }
    }, [
        pendingIdentityKey,
        sofaEventId,
        sourceIdentityStatusForUi,
        sourceIdentityGate
    ]);

    const openSourceIdentityConfirmation = useCallback(() => {
        if (sourceIdentityPresentation.canOpenConfirmation) {
            setConfirmationOpen(true);
        }
    }, [sourceIdentityPresentation.canOpenConfirmation]);

    return {
        sourceIdentity,
        sourceIdentityStatusForUi,
        sourceIdentityPresentation,
        sourceIdentityToast,
        confirmationOpen,
        dismissSourceIdentityToast,
        resetSourceIdentityUi,
        closeSourceIdentityConfirmation,
        handleConfirmSourceIdentity,
        openSourceIdentityConfirmation
    };
}
