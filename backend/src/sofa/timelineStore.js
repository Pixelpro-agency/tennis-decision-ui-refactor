import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isValidEventId } from '../utils/eventId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'match_history');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function createWriteResult(source, eventId, status, reason, file, commitId = null) {
    return {
        ok: status !== 'failed',
        operation: 'timeline',
        source: source === 'sofa' || source === 'betfair' ? source : null,
        eventId,
        status,
        reason,
        file,
        commitId: typeof commitId === 'string' ? commitId : null
    };
}

function hasValidEventId(eventId) {
    return isValidEventId(eventId);
}

function atomicWriteJson(filePath, data) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const tmpPath = path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);
    const json = JSON.stringify(data, null, 2);
    try {
        fs.writeFileSync(tmpPath, json, 'utf8');
        fs.renameSync(tmpPath, filePath);
    } catch (e) {
        try { fs.unlinkSync(tmpPath); } catch (_) {}
        throw e;
    }
}

function sanitizeFilename(name) {
    if (!name) return 'unknown';
    return name.replace(/[^a-zA-Z0-9\s-]/g, '_').trim().replace(/\s+/g, '_');
}

function mergeMetadata(existing = {}, incoming = {}, source) {
    return {
        ...existing,
        ...incoming,
        source,
        eventId: incoming.eventId || existing.eventId,
        players: {
            ...(existing.players || {}),
            ...(incoming.players || {})
        },
        updatedAt: new Date().toISOString()
    };
}

function getPrefix(source) {
    if (source === 'sofa') return 'sofa';
    if (source === 'betfair') return 'betfair';
    throw new Error(`Unknown timeline source: ${source}`);
}

function discoverTimelineFile(source, eventId) {
    if (!isValidEventId(eventId)) {
        return { ok: false, reason: 'invalid_event_id', file: null };
    }

    try {
        const prefix = getPrefix(source) + "_";
        const suffix = "_" + eventId + ".json";
        const filenames = fs.readdirSync(DATA_DIR)
            .filter(file =>
                typeof file === "string" &&
                file.endsWith(".json") &&
                file.includes(".tmp") === false &&
                file.startsWith(prefix) &&
                file.endsWith(suffix)
            )
            .sort();

        if (filenames.length > 1) {
            return { ok: false, reason: 'ambiguous_storage_target', file: null };
        }
        return {
            ok: true,
            reason: null,
            file: filenames[0] ? path.join(DATA_DIR, filenames[0]) : null
        };
    } catch (e) {
        console.error(`[TimelineStore] Error finding ${source} timeline:`, e);
        return { ok: false, reason: 'discovery_failed', file: null };
    }
}

function createTimelineFile(source, eventId, metadata = {}) {
    const date = metadata.date || new Date().toISOString().split('T')[0];
    const tournament = sanitizeFilename(metadata.tournament || 'unknown_tournament');
    const players = metadata.players || {};
    const home = sanitizeFilename(players.home || 'Home');
    const away = sanitizeFilename(players.away || 'Away');
    const prefix = getPrefix(source);

    return path.join(DATA_DIR, `${prefix}_${date}_${tournament}_${home}_vs_${away}_${eventId}.json`);
}

export function getTimelineFile(source, eventId, metadata = {}) {
    const discovery = discoverTimelineFile(source, eventId);
    if (!discovery.ok) return null;
    return discovery.file || createTimelineFile(source, eventId, metadata);
}

export function loadTimelineResult(source, eventId) {
    const discovery = discoverTimelineFile(source, eventId);
    const base = { operation: 'timeline_read', source, eventId };
    if (!discovery.ok) {
        return { ...base, ok: false, status: 'failed', reason: discovery.reason, timeline: null, file: null };
    }
    const filepath = discovery.file;
    if (!filepath) {
        return { ...base, ok: true, status: 'missing', reason: null, timeline: null, file: null };
    }

    try {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (error) {
            const reason = error instanceof SyntaxError ? 'invalid_json' : 'read_failed';
            return { ...base, ok: false, status: 'failed', reason, timeline: null, file: filepath };
        }
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            !data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata) ||
            !Array.isArray(data.timeline)) {
            return { ...base, ok: false, status: 'failed', reason: 'invalid_shape', timeline: null, file: filepath };
        }
        const timeline = {
            ...data,
            latest: data.timeline[data.timeline.length - 1] || null
        };
        return { ...base, ok: true, status: 'found', reason: null, timeline, file: filepath };
    } catch (e) {
        console.error(`[TimelineStore] Error loading ${source} timeline:`, e);
        return { ...base, ok: false, status: 'failed', reason: 'read_failed', timeline: null, file: filepath };
    }
}

export function loadTimeline(source, eventId) {
    const result = loadTimelineResult(source, eventId);
    return result.status === 'found' ? result.timeline : null;
}

export function writeTimelineDocument(source, eventId, timelineObj, metadata = {}, target = null, commitId = null) {
    if (!hasValidEventId(eventId)) {
        return createWriteResult(source, eventId, 'failed', 'invalid_event_id', null, commitId);
    }

    try {
        const resolvedTarget = getTimelineFile(source, eventId, metadata);
        const filepath = typeof target === "string" && target.trim()
            ? target
            : resolvedTarget;

        if (!filepath || (target && resolvedTarget !== target)) {
            return createWriteResult(source, eventId, 'failed', 'write_failed', null, commitId);
        }

        atomicWriteJson(filepath, timelineObj);
        return createWriteResult(source, eventId, 'written', null, filepath, commitId);
    } catch (e) {
        console.error(`[TimelineStore] Error writing ${source} timeline document:`, e);
        return createWriteResult(source, eventId, 'failed', 'write_failed', null, commitId);
    }
}

export function saveTimeline(source, eventId, entryData, metadata = {}, commitId = null) {
    if (!hasValidEventId(eventId)) {
        return createWriteResult(source, eventId, 'failed', 'invalid_event_id', null, commitId);
    }

    try {
        const now = new Date().toISOString();
        const readResult = loadTimelineResult(source, eventId);
        if (readResult.status === 'failed') {
            return createWriteResult(source, eventId, 'failed', readResult.reason, readResult.file, commitId);
        }
        const filepath = readResult.file || getTimelineFile(source, eventId, metadata);

        let timelineObj = {
            metadata: {
                eventId,
                source,
                date: metadata.date || now.split('T')[0],
                tournament: metadata.tournament || 'unknown_tournament',
                players: metadata.players || {},
                sofaUrl: metadata.sofaUrl || '',
                betfairUrl: metadata.betfairUrl || ''
            },
            timeline: []
        };

        if (readResult.status === 'found') {
            timelineObj = readResult.timeline;
            delete timelineObj.latest;
        }

        timelineObj.metadata = mergeMetadata(timelineObj.metadata, metadata, source);
        timelineObj.updatedAt = now;

        const lastEntry = timelineObj.timeline[timelineObj.timeline.length - 1];
        if (lastEntry?.data && JSON.stringify(lastEntry.data) === JSON.stringify(entryData)) {
            return createWriteResult(source, eventId, 'unchanged', null, filepath, commitId);
        }

        const firstTimestamp = timelineObj.timeline[0]?.timestamp || now;
        const elapsedSeconds = Math.max(0, Math.floor((new Date(now) - new Date(firstTimestamp)) / 1000));

        timelineObj.timeline.push({
            timestamp: now,
            elapsedSeconds,
            data: entryData
        });

        const writeResult = writeTimelineDocument(source, eventId, timelineObj, metadata, null, commitId);

        if (!writeResult?.ok) {
            return writeResult && typeof writeResult === 'object'
                ? writeResult
                : createWriteResult(source, eventId, 'failed', 'write_failed', null, commitId);
        }

        return writeResult;
    } catch (e) {
        console.error(`[TimelineStore] Error saving ${source} timeline:`, e);
        return createWriteResult(source, eventId, 'failed', 'write_failed', null, commitId);
    }
}
