import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    return typeof eventId === 'string' && eventId.trim().length > 0;
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

function findTimelineFile(source, eventId) {
    if (!eventId) return null;

    try {
        const prefix = getPrefix(source) + "_";
        const suffix = "_" + eventId + ".json";
        const filename = fs.readdirSync(DATA_DIR)
            .filter(file =>
                typeof file === "string" &&
                file.endsWith(".json") &&
                file.includes(".tmp") === false &&
                file.startsWith(prefix) &&
                file.endsWith(suffix)
            )
            .sort()[0];

        return filename ? path.join(DATA_DIR, filename) : null;
    } catch (e) {
        console.error(`[TimelineStore] Error finding ${source} timeline:`, e);
        return null;
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
    return findTimelineFile(source, eventId) || createTimelineFile(source, eventId, metadata);
}

export function loadTimeline(source, eventId) {
    const filepath = getTimelineFile(source, eventId);
    if (!filepath) return null;

    try {
        if (!fs.existsSync(filepath)) return null;

        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (!Array.isArray(data.timeline)) {
            data.timeline = [];
        }

        return {
            ...data,
            latest: data.timeline[data.timeline.length - 1] || null
        };
    } catch (e) {
        console.error(`[TimelineStore] Error loading ${source} timeline:`, e);
        return null;
    }
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
        const filepath = getTimelineFile(source, eventId, metadata);

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

        if (fs.existsSync(filepath)) {
            timelineObj = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            if (!Array.isArray(timelineObj.timeline)) {
                timelineObj.timeline = [];
            }
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
