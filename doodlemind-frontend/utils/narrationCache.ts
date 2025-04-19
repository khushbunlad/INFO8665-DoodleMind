const cache = new Map<string, string>(); // label → blob URL

export function getCachedNarration(label: string): string | undefined {
  return cache.get(label);
}

export function setCachedNarration(label: string, blobUrl: string) {
  cache.set(label, blobUrl);
}
