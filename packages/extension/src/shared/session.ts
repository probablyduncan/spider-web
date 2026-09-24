const cache: { guid: string } = await chrome.storage.local.get("guid");

if (!cache.guid) {
    cache.guid = crypto.randomUUID();
    chrome.storage.local.set({ guid: cache.guid });
}

export function getGuid(): string {
    return cache.guid;
}
