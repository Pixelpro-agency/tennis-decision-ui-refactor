function asNames(value) {
  return Array.isArray(value)
    ? value.filter((name) => typeof name === 'string' && name.trim())
    : [];
}

function createPresentation(overrides = {}) {
  return {
    tone: 'neutral',
    title: 'Source Identity',
    detail: '',
    canOpenConfirmation: false,
    isPending: false,
    isMismatch: false,
    isRecording: false,
    isNotApplicable: false,
    hasBootstrapError: false,
    ...overrides
  };
}

export function buildSourceIdentityGatePresentation({
  status,
  hasBetfairUrl,
  trackingStopped
} = {}) {
  if (trackingStopped) {
    return createPresentation({
      detail: 'Tracking fermo'
    });
  }

  if (status?.error) {
    return createPresentation({
      tone: 'danger',
      title: 'Registrazione non avviata',
      detail: String(status.error),
      hasBootstrapError: true
    });
  }

  if (!status) {
    if (hasBetfairUrl) {
      return createPresentation({
        detail: 'Verifico fonti…'
      });
    }

    return createPresentation({
      title: 'Betfair non configurato',
      detail: 'Source Identity non necessaria.',
      isNotApplicable: true
    });
  }

  if (status.phase === 'collecting') {
    return createPresentation({
      detail: 'Raccolgo i dati iniziali'
    });
  }

  if (status.phase === 'pending') {
    const sofaPlayers = asNames(status.sourceIdentity?.sofaPlayers);
    const betfairRunners = asNames(status.sourceIdentity?.betfairRunners);
    const canOpenConfirmation =
      status.sourceIdentity?.status === 'pending' &&
      sofaPlayers.length === 2 &&
      betfairRunners.length === 2;

    return createPresentation({
      tone: 'warning',
      title: canOpenConfirmation
        ? 'Conferma richiesta'
        : 'In attesa di nomi completi',
      detail: canOpenConfirmation
        ? 'Controlla i giocatori e i runner.'
        : 'Attendo i nomi completi dalle fonti.',
      canOpenConfirmation,
      isPending: true
    });
  }

  if (
    status.phase === 'recording' &&
    status.sourceIdentity?.status === 'aligned'
  ) {
    return createPresentation({
      tone: 'success',
      title: 'Fonti allineate',
      detail: 'Registrazione live avviata.',
      isRecording: true
    });
  }

  if (status.phase === 'not-applicable') {
    return createPresentation({
      title: 'Betfair non configurato',
      detail: 'Source Identity non necessaria.',
      isNotApplicable: true
    });
  }

  if (status.phase === 'mismatch') {
    return createPresentation({
      tone: 'danger',
      title: 'Fonti non corrispondono',
      detail: 'Correggi i link e avvia di nuovo l’analisi.',
      isMismatch: true
    });
  }

  return createPresentation({
    detail: hasBetfairUrl
      ? 'Verifico fonti…'
      : 'Source Identity non necessaria.'
  });
}
