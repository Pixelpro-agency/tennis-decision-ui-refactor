export function parseDashboardStatValue(value) {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        if (value.includes('/')) {
            const numerator = value.split('/')[0];
            return parseInt(numerator, 10);
        }

        if (value.includes('%')) {
            return parseInt(value, 10);
        }

        return parseInt(value, 10) || 0;
    }

    return 0;
}

export function mapDashboardStatsToRows(statsArray) {
    if (!Array.isArray(statsArray)) {
        return [];
    }

    return statsArray.map((stat, index) => {
        const homeRaw = parseDashboardStatValue(stat.home);
        const awayRaw = parseDashboardStatValue(stat.away);
        const total = homeRaw + awayRaw;

        const homeShare = total === 0
            ? 50
            : Math.round((homeRaw / total) * 100);
        const awayShare = total === 0
            ? 50
            : Math.round((awayRaw / total) * 100);

        let highlight = null;

        if (homeShare > awayShare) {
            highlight = 'home';
        }

        if (awayShare > homeShare) {
            highlight = 'away';
        }

        return {
            key: `stat-${index}`,
            label: stat.label.toUpperCase(),
            homeValue: stat.home,
            awayValue: stat.away,
            bar: {
                type: 'comparison',
                homeShare,
                awayShare,
                highlight
            }
        };
    });
}

export function buildKeyStatsRows(stats) {
    const isStatsObject = !Array.isArray(stats) && stats !== null;

    const totalStatsRaw = isStatsObject && stats.match
        ? stats.match
        : Array.isArray(stats)
            ? stats
            : [];

    const set1StatsRaw = isStatsObject && stats.set1 ? stats.set1 : [];
    const set2StatsRaw = isStatsObject && stats.set2 ? stats.set2 : [];
    const set3StatsRaw = isStatsObject && stats.set3 ? stats.set3 : [];
    const set4StatsRaw = isStatsObject && stats.set4 ? stats.set4 : [];
    const set5StatsRaw = isStatsObject && stats.set5 ? stats.set5 : [];

    return {
        total: mapDashboardStatsToRows(totalStatsRaw),
        set_1: mapDashboardStatsToRows(set1StatsRaw),
        set_2: mapDashboardStatsToRows(set2StatsRaw),
        set_3: mapDashboardStatsToRows(set3StatsRaw),
        set_4: mapDashboardStatsToRows(set4StatsRaw),
        set_5: mapDashboardStatsToRows(set5StatsRaw)
    };
}

export function buildKeyStatsTabs(keyStatsRows) {
    const tabs = [
        {
            id: 'total',
            label: 'TOTALE',
            active: true
        }
    ];

    if (keyStatsRows.set_1.length > 0) {
        tabs.push({
            id: 'set_1',
            label: 'SET 1',
            active: false
        });
    }

    if (keyStatsRows.set_2.length > 0) {
        tabs.push({
            id: 'set_2',
            label: 'SET 2',
            active: false
        });
    }

    if (keyStatsRows.set_3.length > 0) {
        tabs.push({
            id: 'set_3',
            label: 'SET 3',
            active: false
        });
    }

    if (keyStatsRows.set_4.length > 0) {
        tabs.push({
            id: 'set_4',
            label: 'SET 4',
            active: false
        });
    }

    if (keyStatsRows.set_5.length > 0) {
        tabs.push({
            id: 'set_5',
            label: 'SET 5',
            active: false
        });
    }

    return tabs;
}