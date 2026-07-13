import { createScraperRunner } from './scraperLifecycle/runner.js';

export function createScraperLifecycle(options = {}) {
    return createScraperRunner(options);
}

const defaultScraperLifecycle = createScraperLifecycle();

export function fetchScraperLifecycle(context) {
    return defaultScraperLifecycle.fetchScraperLifecycle(context);
}

export function terminateActiveScraperLifecycle() {
    return defaultScraperLifecycle.terminateActiveScrapers();
}
