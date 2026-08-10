import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import MoneyFlowChart from './betfair/MoneyFlowChart.jsx';
import BetfairRunnerDepth, {
    formatObservedAmount,
    formatObservedPrice
} from './betfair/BetfairRunnerDepth.jsx';
import BetfairDepthCard, {
    formatMarketTotalMatched,
    getBetfairCardStateLabel
} from './BetfairDepthCard.jsx';
import BetfairHealthDebugPanel from './betfair/BetfairHealthDebugPanel.jsx';
import MarketReactionsPage from './MarketReactionsPage.jsx';
import MatchContextCard from './MatchContextCard.jsx';

function textContent(renderer) {
    return renderer.root.findAll(node => (
        typeof node.children?.[0] === 'string'
    )).flatMap(node => node.children.filter(child => typeof child === 'string')).join(' ').replace(/\s+/g, ' ').trim();
}

test('MoneyFlowChart uses normalized axis and distinguishes invalid from observed zero', async () => {
    let renderer;
    await act(async () => {
        renderer = TestRenderer.create(
            <MoneyFlowChart
                runnerHistory={[{
                    timestamp: '2026-08-10T10:00:00.000Z',
                    matchedVolume: 0,
                    validForDisplay: true
                }]}
                sharedMaxVal={250}
            />
        );
    });
    assert.match(textContent(renderer), /300/);
    const hoverGroup = renderer.root.findAll(node => node.type === 'g' && node.props.onMouseEnter)[0];
    await act(async () => hoverGroup.props.onMouseEnter());
    assert.match(textContent(renderer), /VOLUME ABBINATO: 0 EUR/);

    await act(async () => {
        renderer.update(
            <MoneyFlowChart
                runnerHistory={[{
                    timestamp: '2026-08-10T10:00:00.000Z',
                    matchedVolume: 0,
                    validForDisplay: false,
                    anomaly: true
                }]}
                sharedMaxVal={250}
            />
        );
    });
    const invalidHoverGroup = renderer.root.findAll(node => node.type === 'g' && node.props.onMouseEnter)[0];
    await act(async () => invalidHoverGroup.props.onMouseEnter());
    assert.doesNotMatch(textContent(renderer), /VOLUME ABBINATO:/);
});

test('BetfairRunnerDepth preserves missing values instead of coercing them to zero', () => {
    assert.equal(formatObservedPrice(null), '—');
    assert.equal(formatObservedPrice(0), '0.00');
    assert.equal(formatObservedAmount(null), '—');
    assert.equal(formatObservedAmount(0), '0');

    const renderer = TestRenderer.create(
        <BetfairRunnerDepth
            runner={{
                name: 'Player A',
                bestBack: null,
                bestBackSize: null,
                bestLay: null,
                bestLaySize: null,
                totalMatchedOnSelection: null,
                ladder: [{ price: null, back: null, lay: null, traded: null }]
            }}
        />
    );
    assert.match(textContent(renderer), /TOTAL MATCHED: — EUR/);
    assert.doesNotMatch(textContent(renderer), /TOTAL MATCHED: 0 EUR/);
});

test('BetfairDepthCard reports real lifecycle and last-known state', () => {
    assert.equal(formatMarketTotalMatched({ market: { totalMatched: null } }), '—');
    assert.equal(getBetfairCardStateLabel({ trackingStopped: true }), 'Live tracking stopped');
    assert.equal(getBetfairCardStateLabel({ readStatus: 'waiting' }), 'Waiting for Betfair Exchange data');

    const stopped = TestRenderer.create(
        <BetfairDepthCard
            data={null}
            readStatus="inactive"
            isPolling={false}
            trackingStopped
        />
    );
    assert.match(textContent(stopped), /Live tracking stopped/);
    assert.doesNotMatch(textContent(stopped), /Polling active \(5s\)/);

    const lastKnown = TestRenderer.create(
        <BetfairDepthCard
            data={null}
            lastKnownData={{ runners: [], market: { totalMatched: 123 } }}
            readStatus="error"
            isPolling
            sourceUpdatedAt={new Date('2026-08-10T10:00:00.000Z')}
            persistenceViewState={{ status: 'error' }}
        />
    );
    assert.match(textContent(lastKnown), /Last known Betfair data/);
});

test('BetfairHealthDebugPanel renders the approved redacted URL field', async () => {
    const renderer = TestRenderer.create(
        <BetfairHealthDebugPanel health={{
            status: 'red',
            metrics: { graphLoginRequiredUrl: 'https://redacted.invalid/login' }
        }} />
    );
    const button = renderer.root.findByType('button');
    await act(async () => button.props.onClick());
    const content = textContent(renderer);
    assert.match(content, /graphLoginRequiredUrl/);
    assert.match(content, /https:\/\/redacted.invalid\/login/);
});

test('MarketReactionsPage renders persistence degradation separately', () => {
    const renderer = TestRenderer.create(
        <MarketReactionsPage
            eventId="123456"
            evidence={null}
            loading={false}
            error={null}
            reasons={['Persistence incomplete']}
            integrity={{ status: 'partial_persistence', reason: 'Canonical sources incomplete' }}
            sources={{ sofaTimelineFound: true, betfairTimelineFound: false }}
            persistenceComplete={false}
            readStatus="degraded"
            isPolling
            refresh={() => {}}
        />
    );
    const content = textContent(renderer);
    assert.match(content, /Evidence persistence is incomplete/);
    assert.match(content, /Canonical sources incomplete/);
});

test('MatchContextCard renders only coherent versioned context', () => {
    const context = {
        version: 1,
        source: 'project-calculated',
        purpose: 'descriptive-match-context',
        match: { pointShare: {
            available: true,
            homePoints: 38,
            awayPoints: 52,
            totalPoints: 90,
            homePct: 42.2,
            awayPct: 57.8
        }},
        recent: {
            available: true,
            reason: null,
            window: {
                kind: 'completed-games',
                requestedGames: 3,
                includedGames: 3,
                excludedCurrentGame: true,
                games: [{}, {}, {}]
            },
            pointShare: {
                available: true,
                homePoints: 12,
                awayPoints: 9,
                totalPoints: 21,
                homePct: 57.1,
                awayPct: 42.9
            }
        },
        comparison: {
            available: true,
            homeDeltaPctPoints: 14.9,
            awayDeltaPctPoints: -14.9,
            observedShift: true
        }
    };
    const players = {
        home: { name: 'Player A' },
        away: { name: 'Player B' }
    };
    const renderer = TestRenderer.create(
        <MatchContextCard localContext={context} players={players} />
    );
    const content = textContent(renderer);
    assert.match(content, /Contesto descrittivo calcolato sui dati SofaScore disponibili/);
    assert.match(content, /42,2%/);
    assert.equal(renderer.root.findAll(node => node.props.role === 'img').length, 2);

    const invalid = structuredClone(context);
    invalid.version = 2;
    const unsupported = TestRenderer.create(
        <MatchContextCard localContext={invalid} players={players} />
    );
    assert.match(textContent(unsupported), /Punti nel match non disponibili/);
    assert.equal(unsupported.root.findAll(node => node.props.role === 'img').length, 0);
});
