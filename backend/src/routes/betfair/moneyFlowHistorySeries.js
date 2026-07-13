import { normalizeSelectionId } from '../../sofa/betfair/moneyFlow.js';
import { buildMoneyFlowHistoryPoint } from './moneyFlowHistory.js';

export function buildMoneyFlowHistorySeries(recentTicks) {
    const seriesBySelectionId = new Map();

    for (let index = 0; index < recentTicks.length; index += 1) {
        const tick = recentTicks[index];
        const previousTick = index > 0 ? recentTicks[index - 1] : null;
        const runners = tick?.data?.runners;

        if (!Array.isArray(runners)) continue;

        for (const runner of runners) {
            const selectionId = normalizeSelectionId(runner?.selectionId);

            if (!runner || selectionId === null) continue;

            let series = seriesBySelectionId.get(selectionId);

            if (!series) {
                series = {
                    selectionId,
                    name: typeof runner.name === 'string' && runner.name
                        ? runner.name
                        : `Selection ${selectionId}`,
                    points: []
                };
                seriesBySelectionId.set(selectionId, series);
            } else if (typeof runner.name === 'string' && runner.name) {
                series.name = runner.name;
            }

            series.points.push(buildMoneyFlowHistoryPoint({
                tick,
                previousTick,
                runner
            }));
        }
    }

    return {
        series: [...seriesBySelectionId.values()]
    };
}
