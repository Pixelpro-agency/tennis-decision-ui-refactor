export function extractEventId(url) {
  if (!url) return null;
  console.log(`[ID Extraction] Testing URL: ${url}`);

  const hashMatch = url.match(/#id[=:](\d+)/i);
  if (hashMatch) {
    console.log(`[ID Extraction] Found in hash: ${hashMatch[1]}`);
    return hashMatch[1];
  }

  const pathMatch = url.match(/\/event\/(\d+)/) || url.match(/\/match\/[^\/]+\/([^\/]+)\/(\d+)/) || url.match(/\/match\/([^\/]+)\/(\d+)$/);
  if (pathMatch) {
    const id = pathMatch[pathMatch.length - 1];
    console.log(`[ID Extraction] Found in path: ${id}`);
    return id;
  }

  const digitMatch = url.match(/[^\d](\d{7,9})(?:[^\d]|$)/);
  if (digitMatch) {
    console.log(`[ID Extraction] Found 7-9 digit sequence: ${digitMatch[1]}`);
    return digitMatch[1];
  }

  const endMatch = url.match(/(\d{6,})/);
  if (endMatch) {
    console.log(`[ID Extraction] Fallback 6+ digits: ${endMatch[1]}`);
    return endMatch[1];
  }

  console.log(`[ID Extraction] NO ID FOUND for URL: ${url}`);
  return null;
}