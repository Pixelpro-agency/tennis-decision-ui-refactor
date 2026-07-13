import path from 'node:path';
import { createHistoryStorage } from '../storage.js';
import {
    addSofaUpdate,
    addBetfairUpdate,
    getHistoryFile,
    loadHistory,
    loadHistoryResult,
    saveHistory
} from '../../matchHistory.js';

let passed = 0;
let failed = 0;

export function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

export function createFakeFs({ initialDirs = [], hooks = {} } = {}) {
    const files = new Map();
    const dirs = new Set(initialDirs);
    const calls = {
        mkdir: [],
        readdir: [],
        read: [],
        write: [],
        rename: [],
        unlink: []
    };

    const fs = {
        existsSync(target) {
            return dirs.has(target) || files.has(target);
        },
        mkdirSync(target) {
            calls.mkdir.push(target);

            if (hooks.mkdirSync) {
                return hooks.mkdirSync(target);
            }

            dirs.add(target);
        },
        readdirSync(dir) {
            calls.readdir.push(dir);

            if (hooks.readdirSync) {
                return hooks.readdirSync(dir);
            }

            return Array.from(files.keys())
                .filter(file => path.dirname(file) === dir)
                .map(file => path.basename(file));
        },
        readFileSync(file) {
            calls.read.push(file);

            if (hooks.readFileSync) {
                return hooks.readFileSync(file);
            }

            if (!files.has(file)) {
                throw new Error('missing file');
            }

            return files.get(file);
        },
        writeFileSync(file, content) {
            calls.write.push(file);

            if (hooks.writeFileSync) {
                return hooks.writeFileSync(file, content);
            }

            files.set(file, content);
        },
        renameSync(from, to) {
            calls.rename.push({ from, to });

            if (hooks.renameSync) {
                return hooks.renameSync(from, to);
            }

            if (!files.has(from)) {
                throw new Error('missing temp file');
            }

            files.set(to, files.get(from));
            files.delete(from);
        },
        unlinkSync(file) {
            calls.unlink.push(file);

            if (hooks.unlinkSync) {
                return hooks.unlinkSync(file);
            }

            files.delete(file);
        }
    };

    return {
        fs,
        files,
        dirs,
        calls,
        seed(file, content) {
            files.set(file, content);
        }
    };
}

export function createStorage(fake, historyDir) {
    return createHistoryStorage({
        fs: fake.fs,
        path,
        historyDir,
        processId: 91,
        getNow() {
            return new Date('2026-06-22T12:34:56.000Z');
        },
        getNowMs() {
            return 123456;
        }
    });
}

export function captureErrors(callback) {
    const originalConsoleError = console.error;
    const messages = [];

    console.error = (...args) => {
        messages.push(args.map(value => String(value)).join(' '));
    };

    try {
        return {
            value: callback(),
            messages
        };
    } finally {
        console.error = originalConsoleError;
    }
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}
