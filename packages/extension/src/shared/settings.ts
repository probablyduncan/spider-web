const defaultSettings = {
    worldwide: true,
    infestation: false,
    showMessages: true,
};

export type ExtensionSettings = typeof defaultSettings;
export type ExtensionSettingKey = keyof ExtensionSettings;
export type OnExtensionSettingChange = (changes: Partial<Record<ExtensionSettingKey, { newValue: boolean, oldValue: boolean }>>) => void;

const cache: ExtensionSettings = await chrome.storage.local.get(defaultSettings);
chrome.storage.local.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => {
        cache[key as ExtensionSettingKey] = changes[key].newValue as boolean;
    });
});

export function getSetting(key: ExtensionSettingKey) {
    return cache[key] as boolean;
}

export function setSetting(key: ExtensionSettingKey, value: boolean) {
    chrome.storage.local.set({ [key]: value });
}

export function isSetting(key: string) {
    return key in defaultSettings;
}

export function resetSetting(key: ExtensionSettingKey) {
    setSetting(key, defaultSettings[key]);
    return defaultSettings[key];
}