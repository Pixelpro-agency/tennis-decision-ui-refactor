export const GRID_SIZE = 20;

export function toNumber(value, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function createEmptyGridPoint(timestamp) {
    return {
        timestamp,
        matchedVolume: 0,
        emptySlot: true,
        invalidVolume: false,
        anomaly: false,
        validForDisplay: false
    };
}

export function getDisplayMatchedVolume(point) {
    if (
        !point ||
        point.emptySlot ||
        point.invalidVolume ||
        point.anomaly ||
        point.validForDisplay === false
    ) {
        return 0;
    }

    const matchedVolume = Number(point.matchedVolume);

    return Number.isFinite(matchedVolume) && matchedVolume > 0
        ? matchedVolume
        : 0;
}

export function buildSharedGrid(pointSeriesList) {
    const seen = new Set();
    const allTimestamps = [];
    const seriesList = Array.isArray(pointSeriesList) ? pointSeriesList : [];

    for (const points of seriesList) {
        if (!Array.isArray(points)) continue;

        for (const point of points) {
            if (point?.timestamp && !seen.has(point.timestamp)) {
                seen.add(point.timestamp);
                allTimestamps.push(point.timestamp);
            }
        }
    }

    allTimestamps.sort((firstTimestamp, secondTimestamp) => {
        const firstTime = Date.parse(firstTimestamp);
        const secondTime = Date.parse(secondTimestamp);

        if (Number.isFinite(firstTime) && Number.isFinite(secondTime)) {
            return firstTime - secondTime;
        }

        return String(firstTimestamp).localeCompare(String(secondTimestamp));
    });

    const realTimestamps = allTimestamps.slice(-GRID_SIZE);
    const paddingCount = GRID_SIZE - realTimestamps.length;
    const emptySlots = Array.from(
        { length: paddingCount },
        (_, index) => ({
            key: `__empty_${index}`,
            timestamp: ''
        })
    );
    const realSlots = realTimestamps.map(timestamp => ({
        key: timestamp,
        timestamp
    }));

    return emptySlots.concat(realSlots);
}

export function alignToGrid(grid, runnerHistory) {
    const pointsByTimestamp = new Map();

    for (const point of runnerHistory || []) {
        if (point.timestamp) {
            pointsByTimestamp.set(point.timestamp, point);
        }
    }

    return grid.map(slot => {
        if (!slot.timestamp) {
            return createEmptyGridPoint('');
        }

        return pointsByTimestamp.get(slot.timestamp) ||
            createEmptyGridPoint(slot.timestamp);
    });
}

export function computeFlowWom(historyPoints) {
    let backSum = 0;
    let laySum = 0;
    let unclassifiedSum = 0;

    if (historyPoints && historyPoints.length > 0) {
        historyPoints.slice(-GRID_SIZE).forEach(point => {
            backSum += toNumber(point.back);
            laySum += toNumber(point.lay);
            unclassifiedSum += Math.max(
                toNumber(point.unclassified),
                toNumber(point.suppressedVolume)
            );
        });
    }

    const classifiedTotal = backSum + laySum;
    const total = classifiedTotal;
    const lastPoint = historyPoints && historyPoints.length > 0
        ? historyPoints[historyPoints.length - 1]
        : null;

    return {
        wom: total > 0 ? backSum / total : 0.5,
        backSum,
        laySum,
        unclassifiedSum,
        classifiedTotal,
        unclassifiedDominates:
            unclassifiedSum > 0 && unclassifiedSum > classifiedTotal,
        lastUnclassified: lastPoint
            ? Math.max(
                toNumber(lastPoint.unclassified),
                toNumber(lastPoint.suppressedVolume)
            )
            : 0
    };
}
