export function createHistoryStorage({
    fs,
    path,
    historyDir,
    getNow = () => new Date(),
    getNowMs = () => Date.now(),
    processId = process.pid
}) {
    if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
    }

    function createWriteResult(eventId, status, reason, file, commitId = null) {
        return {
            ok: status !== 'failed',
            operation: 'history',
            source: null,
            eventId,
            status,
            reason,
            file,
            commitId: typeof commitId === 'string' ? commitId : null
        };
    }

    function createReadResult(eventId, status, reason, history, file) {
        return {
            ok: status === 'found' || status === 'missing',
            operation: 'history_read',
            eventId: typeof eventId === 'string' ? eventId : null,
            status,
            reason,
            history,
            file
        };
    }

    function hasValidEventId(eventId) {
        return typeof eventId === 'string' && eventId.trim().length > 0;
    }

    function atomicWriteJson(filePath, data) {
        const dir = path.dirname(filePath);
        const base = path.basename(filePath);
        const tmpPath = path.join(dir, `.${base}.${processId}.${getNowMs()}.tmp`);
        const json = JSON.stringify(data, null, 2);

        try {
            fs.writeFileSync(tmpPath, json, 'utf8');
            fs.renameSync(tmpPath, filePath);
        } catch (e) {
            try {
                fs.unlinkSync(tmpPath);
            } catch (_) {
            }
            throw e;
        }
    }

    function sanitizeFilename(name) {
        if (!name) return 'unknown';

        return name
            .replace(/[^a-zA-Z0-9\s-]/g, '_')
            .trim()
            .replace(/\s+/g, '_');
    }

    function discoverHistoryFile(eventId) {
        if (!hasValidEventId(eventId)) {
            return { ok: false, reason: 'invalid_event_id', file: null };
        }

        try {
            const suffix = `_${eventId}.json`;
            const filename = fs.readdirSync(historyDir)
                .filter(file =>
                    typeof file === 'string' &&
                    file.endsWith('.json') &&
                    !file.includes('.tmp') &&
                    !file.startsWith('sofa_') &&
                    !file.startsWith('betfair_') &&
                    file.endsWith(suffix)
                )
                .sort()[0];

            return {
                ok: true,
                reason: null,
                file: filename ? path.join(historyDir, filename) : null
            };
        } catch (e) {
            console.error('[MatchHistory] Error finding history file:', e);
            return { ok: false, reason: 'discovery_failed', file: null };
        }
    }

    function getHistoryFile(eventId) {
        const result = discoverHistoryFile(eventId);
        return result.ok ? result.file : null;
    }

    function loadHistoryResult(eventId) {
        const discovery = discoverHistoryFile(eventId);

        if (!discovery.ok) {
            return createReadResult(
                eventId,
                'failed',
                discovery.reason,
                null,
                null
            );
        }

        if (!discovery.file) {
            return createReadResult(eventId, 'missing', null, null, null);
        }

        try {
            const content = fs.readFileSync(discovery.file, 'utf8');

            try {
                const history = JSON.parse(content);
                return createReadResult(
                    eventId,
                    'found',
                    null,
                    history,
                    discovery.file
                );
            } catch (parseErr) {
                console.error('[MatchHistory] Error loading history file:', parseErr);
                return createReadResult(
                    eventId,
                    'failed',
                    'invalid_json',
                    null,
                    discovery.file
                );
            }
        } catch (readErr) {
            console.error('[MatchHistory] Error loading history file:', readErr);
            return createReadResult(
                eventId,
                'failed',
                'read_failed',
                null,
                discovery.file
            );
        }
    }

    function loadHistory(eventId) {
        const result = loadHistoryResult(eventId);
        return result.status === 'found' ? result.history : null;
    }

    function resolveHistoryFile(eventId, metadata = {}) {
        if (!hasValidEventId(eventId)) return null;
    
        const existing = getHistoryFile(eventId);
    
        if (existing) return existing;
    
        const dateStr = metadata.date || getNow().toISOString().split('T')[0];
        const tournamentStr = sanitizeFilename(metadata.tournament || 'unknown_tournament');
        const homeStr = sanitizeFilename(metadata.players?.home || 'Home');
        const awayStr = sanitizeFilename(metadata.players?.away || 'Away');
        const filename = `${dateStr}_${tournamentStr}_${homeStr}_vs_${awayStr}_${eventId}.json`;
    
        return path.join(historyDir, filename);
    }
    
    function writeHistoryDocument(eventId, historyData, metadata = {}, target = null, commitId = null) {
        if (!hasValidEventId(eventId)) {
            return createWriteResult(eventId, 'failed', 'invalid_event_id', null, commitId);
        }
    
        const resolvedTarget = resolveHistoryFile(eventId, metadata);
        const filepath = typeof target === 'string' && target.trim()
            ? target
            : resolvedTarget;
    
        if (!filepath || (target && resolvedTarget !== target)) {
            return createWriteResult(eventId, 'failed', 'write_failed', null, commitId);
        }
    
        try {
            atomicWriteJson(filepath, historyData);
            return createWriteResult(eventId, 'written', null, filepath, commitId);
        } catch (e) {
            console.error('[MatchHistory] Error saving history file:', e);
            return createWriteResult(eventId, 'failed', 'write_failed', null, commitId);
        }
    }
    
    function saveHistory(eventId, historyData, metadata = {}, commitId = null) {
        return writeHistoryDocument(eventId, historyData, metadata, null, commitId);
    }


    return {
        getHistoryFile,
        resolveHistoryFile,
        loadHistory,
        loadHistoryResult,
        saveHistory,
        writeHistoryDocument
    };
}
