import { buildMarketEvidence } from './marketEvidence.js';
import { buildLayTheWinnerContext } from './layTheWinner/context.js';

export function buildLayTheWinnerViewModel(snapshot, _legacyInput, betfairTimeline, eventId) {
    const {
        homeName,
        awayName,
        winner1stSet,
        winner1stSetAvailable,
        breakOpportunities,
        breakOpportunitiesAvailable,
        servingName,
        gameScore,
        currentSet
    } = buildLayTheWinnerContext(snapshot);

    const marketEvidence = buildMarketEvidence(betfairTimeline, snapshot, eventId);

    return {
        app: {
            tabs: [
                { id: "lay_the_winner", label: "Lay the Winner", speed: "SLOW", active: true },
                { id: "banca_servizio", label: "Banca Servizio", speed: "FAST", active: false },
                { id: "super_break", label: "Super Break", speed: "MID", active: false }
            ]
        },

        header: {
            competition: snapshot.status?.description || "\u2014",
            status: snapshot.status?.type === "inprogress" ? "LIVE" : (snapshot.status?.type || "\u2014"),
            matchTitle: `${homeName} vs ${awayName}`,
            set: currentSet,
            gameScore,
            serving: servingName,
            connections: {
                sofa: { label: "Sofa", status: "connected", ok: true },
                modelTot: { label: "Model/TOT", ok: false }
            }
        },

        strategy: {
            id: "lay_the_winner",
            name: "Lay the Winner",
            speed: "SLOW",
            available: false,
            reason: "legacy_signal_unavailable",

            decision: {
                signal: "UNAVAILABLE",
                edgePct: null,
                action: null,
                marketRuleText: null,
                validForSec: null,
                borderlineNote: null,
                availability: {
                    legacy: { available: false, reason: "legacy_signal_unavailable" },
                    edge: { available: false, reason: "TRADE_ON_TENNIS_NOT_AVAILABLE" },
                    market: { available: marketEvidence.available, reason: marketEvidence.reason }
                }
            },

            entryRules: [],

            successProbability: {
                pct: null,
                label: "Success Probability",
                available: false,
                reason: "TOT_NOT_IMPLEMENTED"
            },

            setupContext: [
                { label: "Winner 1st set", value: winner1stSet || "\u2014", available: winner1stSetAvailable },
                { label: "Favorite pre-match", value: "\u2014", available: false, reason: "NO_TOT_OR_RANKING_SOURCE" },
                { label: "Break opportunities (set 2)", value: breakOpportunities, available: breakOpportunitiesAvailable }
            ],

            strategyChecklist: [],

            marketEvidence
        },

        footerHints: {
            source: "SofaScore APIs",
            update: "Auto-updated via polling",
            note: "Legacy signal unavailable; Betfair market evidence remains connected."
        }
    };
}
