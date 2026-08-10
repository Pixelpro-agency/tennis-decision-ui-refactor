export function extractEventId(url) {
  if (!url) return null;
  const hashMatch = url.match(/#id[=:](\d+)/i);
  if (hashMatch) {
    return hashMatch[1];
  }

  const pathMatch = url.match(/\/event\/(\d+)/) || url.match(/\/match\/[^\/]+\/([^\/]+)\/(\d+)/) || url.match(/\/match\/([^\/]+)\/(\d+)$/);
  if (pathMatch) {
    const id = pathMatch[pathMatch.length - 1];
    return id;
  }

  const digitMatch = url.match(/[^\d](\d{7,9})(?:[^\d]|$)/);
  if (digitMatch) {
    return digitMatch[1];
  }

  const endMatch = url.match(/(\d{6,})/);
  if (endMatch) {
    return endMatch[1];
  }

  return null;
}
