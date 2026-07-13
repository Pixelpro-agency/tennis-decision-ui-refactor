import { isGraphCompatibleLadderSource } from '../moneyFlow.js';

export function summarizeCanonicalLadders(runners) {
    const ladderRows = runners.reduce(
        (sum, runner) => sum + (Array.isArray(runner.ladder) ? runner.ladder.length : 0),
        0
    );

    const baseQuotesAvailable = runners.some(runner =>
        runner.bestBack > 0 || runner.bestLay > 0
    );

    let anyUsableLadder = false;
    let anyUsableGraphLadder = false;
    let graphLadderRunners = 0;
    let bookLadderRunners = 0;
    let graphLadderRows = 0;

    for (const runner of runners) {
        if (!Array.isArray(runner.ladder) || runner.ladder.length === 0) continue;

        const hasUsableRow = runner.ladder.some(row =>
            typeof row.price === 'number' &&
            (
                (typeof row.back === 'number' && row.back > 0) ||
                (typeof row.lay === 'number' && row.lay > 0) ||
                (typeof row.traded === 'number' && row.traded > 0)
            )
        );

        if (!hasUsableRow) continue;

        anyUsableLadder = true;

        if (isGraphCompatibleLadderSource(runner.ladderSource)) {
            anyUsableGraphLadder = true;
            graphLadderRunners++;
            graphLadderRows += runner.ladder.length;
        } else if (runner.ladderSource === 'book_depth' || runner.ladderSource === 'book') {
            bookLadderRunners++;
        }
    }

    let overallLadderSource = 'none';
    if (graphLadderRunners > 0 && bookLadderRunners > 0) {
        overallLadderSource = 'mixed';
    } else if (graphLadderRunners > 0) {
        overallLadderSource = 'graph';
    } else if (bookLadderRunners > 0) {
        overallLadderSource = 'book';
    }

    return {
        ladderRows,
        baseQuotesAvailable,
        anyUsableLadder,
        anyUsableGraphLadder,
        graphLadderRows,
        overallLadderSource
    };
}
