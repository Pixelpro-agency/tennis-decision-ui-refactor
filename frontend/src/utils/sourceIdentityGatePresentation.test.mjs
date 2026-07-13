import assert from 'node:assert/strict';
import {
  buildSourceIdentityGatePresentation
} from './sourceIdentityGatePresentation.js';

function expectPresentation(name, input, expected) {
  assert.deepEqual(
    buildSourceIdentityGatePresentation(input),
    expected,
    name
  );
  console.log(`✓ ${name}`);
}

const base = {
  canOpenConfirmation: false,
  isPending: false,
  isMismatch: false,
  isRecording: false,
  isNotApplicable: false,
  hasBootstrapError: false
};

expectPresentation(
  'collecting',
  {
    status: { phase: 'collecting' },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'neutral',
    title: 'Source Identity',
    detail: 'Raccolgo i dati iniziali'
  }
);

expectPresentation(
  'pending complete',
  {
    status: {
      phase: 'pending',
      sourceIdentity: {
        status: 'pending',
        sofaPlayers: ['Player One', 'Player Two'],
        betfairRunners: ['Runner One', 'Runner Two']
      }
    },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'warning',
    title: 'Conferma richiesta',
    detail: 'Controlla i giocatori e i runner.',
    canOpenConfirmation: true,
    isPending: true
  }
);

expectPresentation(
  'pending incomplete',
  {
    status: {
      phase: 'pending',
      sourceIdentity: {
        status: 'pending',
        sofaPlayers: ['Player One'],
        betfairRunners: ['Runner One', 'Runner Two']
      }
    },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'warning',
    title: 'In attesa di nomi completi',
    detail: 'Attendo i nomi completi dalle fonti.',
    isPending: true
  }
);

expectPresentation(
  'recording aligned',
  {
    status: {
      phase: 'recording',
      sourceIdentity: { status: 'aligned' }
    },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'success',
    title: 'Fonti allineate',
    detail: 'Registrazione live avviata.',
    isRecording: true
  }
);

expectPresentation(
  'mismatch',
  {
    status: { phase: 'mismatch' },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'danger',
    title: 'Fonti non corrispondono',
    detail: 'Correggi i link e avvia di nuovo l’analisi.',
    isMismatch: true
  }
);

expectPresentation(
  'not applicable',
  {
    status: { phase: 'not-applicable' },
    hasBetfairUrl: false,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'neutral',
    title: 'Betfair non configurato',
    detail: 'Source Identity non necessaria.',
    isNotApplicable: true
  }
);

expectPresentation(
  'bootstrap error',
  {
    status: { error: 'Unable to load source identity status.' },
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'danger',
    title: 'Registrazione non avviata',
    detail: 'Unable to load source identity status.',
    hasBootstrapError: true
  }
);

expectPresentation(
  'missing status with Betfair',
  {
    status: null,
    hasBetfairUrl: true,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'neutral',
    title: 'Source Identity',
    detail: 'Verifico fonti…'
  }
);

expectPresentation(
  'missing status without Betfair',
  {
    status: null,
    hasBetfairUrl: false,
    trackingStopped: false
  },
  {
    ...base,
    tone: 'neutral',
    title: 'Betfair non configurato',
    detail: 'Source Identity non necessaria.',
    isNotApplicable: true
  }
);

expectPresentation(
  'tracking stopped',
  {
    status: { phase: 'mismatch' },
    hasBetfairUrl: true,
    trackingStopped: true
  },
  {
    ...base,
    tone: 'neutral',
    title: 'Source Identity',
    detail: 'Tracking fermo'
  }
);
