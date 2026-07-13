import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isConfirmationRecordApplicable } from './sourceIdentityConfirmation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SOURCE_IDENTITY_CONFIRMATION_STORE_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'source_identity_confirmations.json'
);

function emptyArchive() {
    return { version: 1, confirmations: [] };
}

function asString(value) {
    return value === null || value === undefined ? '' : String(value);
}

function copyStrings(value) {
    return Array.isArray(value)
        ? value.map(item => asString(item).trim())
        : [];
}

function copyPairs(value) {
    return Array.isArray(value)
        ? value.map(pair => ({
            sofaPlayer: asString(pair?.sofaPlayer).trim(),
            betfairRunner: asString(pair?.betfairRunner).trim()
        }))
        : [];
}

function normalizeRecord(record, fallbackCreatedAt = null) {
    const normalized = {
        fingerprint: asString(record?.fingerprint).trim(),
        eventId: asString(record?.eventId).trim(),
        epochSignature: asString(record?.epochSignature).trim(),
        marketId: asString(record?.marketId).trim(),
        selectionIds: copyStrings(record?.selectionIds).sort(),
        sofaPlayers: copyStrings(record?.sofaPlayers),
        betfairRunners: copyStrings(record?.betfairRunners),
        selectedPairs: copyPairs(record?.selectedPairs),
        createdAt: asString(record?.createdAt || fallbackCreatedAt).trim()
    };

    if (
        !normalized.fingerprint ||
        !normalized.eventId ||
        !normalized.epochSignature ||
        !normalized.marketId ||
        normalized.selectionIds.length !== 2 ||
        new Set(normalized.selectionIds).size !== 2 ||
        normalized.sofaPlayers.length !== 2 ||
        new Set(normalized.sofaPlayers).size !== 2 ||
        normalized.betfairRunners.length !== 2 ||
        new Set(normalized.betfairRunners).size !== 2 ||
        normalized.selectedPairs.length !== 2 ||
        new Set(normalized.selectedPairs.map(pair => `${pair.sofaPlayer}\u0000${pair.betfairRunner}`)).size !== 2 ||
        normalized.selectedPairs.some(pair => !pair.sofaPlayer || !pair.betfairRunner) ||
        !normalized.createdAt
    ) {
        return null;
    }

    return normalized;
}

function copyRecord(record) {
    return {
        ...record,
        selectionIds: record.selectionIds.slice(),
        sofaPlayers: record.sofaPlayers.slice(),
        betfairRunners: record.betfairRunners.slice(),
        selectedPairs: record.selectedPairs.map(pair => ({ ...pair }))
    };
}

function sameContext(left, right) {
    return left.eventId === right.eventId &&
        left.epochSignature === right.epochSignature &&
        left.marketId === right.marketId &&
        JSON.stringify(left.selectionIds) === JSON.stringify(right.selectionIds) &&
        JSON.stringify(left.sofaPlayers) === JSON.stringify(right.sofaPlayers) &&
        JSON.stringify(left.betfairRunners) === JSON.stringify(right.betfairRunners);
}

function writeArchiveAtomically(filePath, archive) {
    const directory = path.dirname(filePath);
    const temporaryPath = path.join(
        directory,
        `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
    );

    fs.mkdirSync(directory, { recursive: true });

    try {
        fs.writeFileSync(temporaryPath, JSON.stringify(archive, null, 2), 'utf8');
        fs.renameSync(temporaryPath, filePath);
    } catch (error) {
        try {
            if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
        } catch (_) {}
        throw error;
    }
}

export function readSourceIdentityConfirmationStore({
    filePath = SOURCE_IDENTITY_CONFIRMATION_STORE_PATH
} = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            return { ok: true, archive: emptyArchive() };
        }

        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (parsed?.version !== 1 || !Array.isArray(parsed.confirmations)) {
            return { ok: false, archive: emptyArchive() };
        }

        const confirmations = parsed.confirmations.map(record => normalizeRecord(record));
        if (confirmations.some(record => record === null)) {
            return { ok: false, archive: emptyArchive() };
        }

        return {
            ok: true,
            archive: {
                version: 1,
                confirmations: confirmations.map(copyRecord)
            }
        };
    } catch (_) {
        return { ok: false, archive: emptyArchive() };
    }
}

export function upsertSourceIdentityConfirmation(
    record,
    { filePath = SOURCE_IDENTITY_CONFIRMATION_STORE_PATH } = {}
) {
    const normalized = normalizeRecord(record, new Date().toISOString());
    if (!normalized) return { ok: false };

    const current = readSourceIdentityConfirmationStore({ filePath });
    if (!current.ok) return { ok: false };

    const existing = current.archive.confirmations.find(
        confirmation => confirmation.fingerprint === normalized.fingerprint
    );
    if (existing) {
        return { ok: true, created: false, record: copyRecord(existing) };
    }

    const archive = {
        version: 1,
        confirmations: [
            ...current.archive.confirmations.filter(
                confirmation => !sameContext(confirmation, normalized)
            ),
            normalized
        ]
    };

    try {
        writeArchiveAtomically(filePath, archive);
        return { ok: true, created: true, record: copyRecord(normalized) };
    } catch (_) {
        return { ok: false };
    }
}

export function findApplicableSourceIdentityConfirmation(
    context,
    { filePath = SOURCE_IDENTITY_CONFIRMATION_STORE_PATH } = {}
) {
    const current = readSourceIdentityConfirmationStore({ filePath });
    if (!current.ok) return { ok: false, confirmation: null };

    const confirmation = current.archive.confirmations.find(record =>
        isConfirmationRecordApplicable({ context, confirmation: record })
    );

    return {
        ok: true,
        confirmation: confirmation ? copyRecord(confirmation) : null
    };
}

export function revokeSourceIdentityConfirmation(
    fingerprint,
    { filePath = SOURCE_IDENTITY_CONFIRMATION_STORE_PATH } = {}
) {
    const value = asString(fingerprint).trim();
    if (!value) return { ok: false };

    const current = readSourceIdentityConfirmationStore({ filePath });
    if (!current.ok) return { ok: false };

    const confirmations = current.archive.confirmations.filter(
        confirmation => confirmation.fingerprint !== value
    );

    if (confirmations.length === current.archive.confirmations.length) {
        return { ok: true, revoked: false };
    }

    try {
        writeArchiveAtomically(filePath, { version: 1, confirmations });
        return { ok: true, revoked: true };
    } catch (_) {
        return { ok: false };
    }
}