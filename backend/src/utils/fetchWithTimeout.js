export class FetchTimeoutError extends Error {
    constructor() {
        super('fetch_timeout');
        this.name = 'FetchTimeoutError';
        this.code = 'fetch_timeout';
    }
}

export async function fetchWithTimeout(fetchFn, input, init = {}, timeoutMs = 4000) {
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            controller.abort();
            reject(new FetchTimeoutError());
        }, timeoutMs);
    });
    try {
        return await Promise.race([
            fetchFn(input, { ...init, signal: controller.signal }),
            timeout
        ]);
    } finally {
        clearTimeout(timer);
    }
}

