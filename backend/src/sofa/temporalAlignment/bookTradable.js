export function checkBookTradable(runner) {
    if (!runner || typeof runner !== 'object') return false;
    const bb = typeof runner.bestBack === 'number' ? runner.bestBack : null;
    const bl = typeof runner.bestLay === 'number' ? runner.bestLay : null;
    return bb !== null && bl !== null && bb > 0 && bl > 0 && bl > bb;
}
