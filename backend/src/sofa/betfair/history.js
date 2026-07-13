export function compileBetfairHistory(historyObj) {
    const result = {};
    if (!historyObj || !Array.isArray(historyObj.history)) return result;

    const betfairRows = historyObj.history.filter(row =>
        row && row.betfair && Array.isArray(row.betfair.runners) && row.betfair.runners.length > 0
    );
    const recentRows = betfairRows.slice(-35);
    const MAX_CANDLES = 20;

    recentRows.forEach((row) => {
        const timeStr = row.timestamp
            ? new Date(row.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
            : '';

        row.betfair.runners.forEach(runner => {
            const name = runner && runner.name;
            if (!name) return;
            if (!Array.isArray(result[name])) result[name] = [];

            const flow = runner.moneyFlow || { back: 0, lay: 0, trend: 'neutral' };
            const backVal = typeof flow.back === 'number' ? flow.back : 0;
            const layVal = typeof flow.lay === 'number' ? flow.lay : 0;
            const trendVal = flow.trend || 'neutral';
            const confidenceVal = flow.confidence || 'suppressed';
            const reasonVal = flow.reason ?? null;

            const lastPt = result[name].length > 0 ? result[name][result[name].length - 1] : null;
            if (backVal === 0 && layVal === 0 && lastPt && lastPt.back === 0 && lastPt.lay === 0) {
                return;
            }
            if (lastPt && lastPt.back === backVal && lastPt.lay === layVal) {
                return;
            }

            result[name].push({ timestamp: timeStr, back: backVal, lay: layVal, trend: trendVal, confidence: confidenceVal, reason: reasonVal });
            if (result[name].length > MAX_CANDLES) {
                result[name].shift();
            }
        });
    });

    return result;
}