export const mockStrategyData = {
    app: {
        title: "Tennis Decision Dashboard",
        theme: "dark",
        mode: "Decision",
        tabs: [
            { id: "lay_the_winner", label: "Lay the Winner", speed: "SLOW", active: true },
            { id: "banca_servizio", label: "Banca Servizio", speed: "FAST", active: false },
            { id: "super_break", label: "Super Break", speed: "MID", active: false }
        ]
    },
    header: {
        competition: "ATP Masters 1000",
        status: "LIVE",
        matchTitle: "Sinner vs ALCARAZ",
        set: 2,
        gameScore: "4-3",
        serving: "Sinner",
        connections: {
            sofa: { label: "Sofa", status: "connected", ok: true },
            modelTot: { label: "Model/TOT", ok: true }
        }
    },
    strategy: {
        id: "lay_the_winner",
        name: "Lay the Winner",
        speed: "SLOW",
        decision: {
            signal: "ENTER",
            edgePct: 6.4,
            action: "LAY",
            marketRuleText: "LAY @ > 2.18",
            validForSec: 38,
            thresholds: {
                greenMinLayOdds: 2.15,
                yellowRangeLayOdds: { min: 2.10, max: 2.15 },
                redMaxLayOdds: 2.10
            },
            borderlineNote: "Borderline • 2%"
        },
        entryRules: [
            {
                level: "GREEN",
                label: "ENTER",
                rule: "if LAY odds ≥ 2.15",
                edgeRule: "(edge ≥ +5%)",
                uiIcon: "check"
            },
            {
                level: "YELLOW",
                label: "BORDERLINE",
                rule: "if 2.10 - 2.15",
                edgeRule: "(edge +2% to +5%)",
                uiIcon: "warning"
            },
            {
                level: "RED",
                label: "SKIP",
                rule: "if LAY odds < 2.10",
                edgeRule: "(edge < -2%)",
                uiIcon: "x"
            }
        ],
        successProbability: {
            pct: 57,
            label: "Success Probability"
        },
        setupContext: [
            { label: "Winner 1st set", value: "Alcaraz" },
            { label: "Favorite pre-match", value: "Sinner" },
            { label: "Current story", value: "Sinner building return pressure" },
            { label: "Break opportunities (set 2)", value: "Sinner 3 BP created" }
        ],
        strategyChecklist: [
            { label: "Winner 1st set identified", ok: true },
            { label: "Favorite down a set (or 'recovery' profile)", ok: true },
            { label: "Set 2 in 'pressure window' (worst of 3/1 discs)", ok: true },
            { label: "Momentum: Sinner 62%", ok: true, badge: "WARNING" }
        ],
        exitPlan: {
            takeProfit: "on BP / break by 1st set winner",
            abort: "edge < 0% or leader consolidates",
            abortDetail: "Easy holds + momentum drops"
        }
    },
    footerHints: {
        source: "React.LiveOddsAPI",
        update: "Auto-calculated Fair updated 2s ago",
        note: "Use an Exchange to confirm exact market odds"
    }
};
