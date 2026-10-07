const defaultSettings = {
    frequency: 1,
    size: 1,
    resolution: 1,
    enabled: 1,
    scatter: 1,
};

// Frequency:
// Blue Moon | Occasional | Regular | Infestation
// Size:
// Pinhead | Fingernail | Silver Dollar | Dinner Plate
// Resolution:
// Crisp | Soggy | Retro | No Spectacles

export type ExtensionSettings = typeof defaultSettings;
export type ExtensionSettingKey = keyof ExtensionSettings;
export type OnExtensionSettingChange = (changes: Partial<Record<ExtensionSettingKey, { newValue: boolean, oldValue: boolean }>>) => void;

const cache: ExtensionSettings = await chrome.storage.local.get(defaultSettings);
chrome.storage.local.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => {
        if (isSetting(key)) {
            cache[key as ExtensionSettingKey] = changes[key].newValue as number;
        }
    });
});

export function getSetting(key: ExtensionSettingKey) {
    return cache[key] as number;
}

export function setSetting(key: ExtensionSettingKey, value: number) {
    chrome.storage.local.set({ [key]: value });
}

export function isSetting(key: string) {
    return key in defaultSettings;
}

export function resetSetting(key: ExtensionSettingKey) {
    setSetting(key, defaultSettings[key]);
    return defaultSettings[key];
}

export function onSettingChange(
    key: ExtensionSettingKey,
    onChange: (newValue: number, oldValue: number | undefined) => void,
    runOnAttach: boolean = true,
) {
    chrome.storage.local.onChanged.addListener((changes) => {
        if (key in changes) {
            onChange(changes[key].newValue as number, changes[key].oldValue as number | undefined);
        }
    });

    if (runOnAttach) {
        onChange(cache[key], cache[key]);
    }
}

// let { sites: _sites } = await chrome.storage.local.get({ sites: {} }) as { sites: Record<string, boolean> };
// export function updateSiteSettings(url: string, choice: "enable" | "disable" | "unset") {
//     const host = new URL(url).hostname;
//     if (choice === "unset") {
//         delete _sites[host];
//         chrome.storage.local.set({ sites: _sites })
//     }
// }

// chrome.storage.local.onChanged.addListener((changes) => {
//     if ("sites" in changes) {
//         //@ts-ignore
//         _sites = changes.sites.newValue ?? {};
//     }
// });

// export function onEnableDisableForThisPage(url: string, onChange: (enabled: boolean) => void) {
//     const host = new URL(url).hostname;
//     chrome.storage.local.onChanged.addListener((changes) => {
//         if ("sites" in changes) {
//             //@ts-ignore
//             onChange(changes.sites.newValue[host] as boolean ?? !!getSetting("enabled"));
//         }
//     });
// }

// export function getThisPageConfig(url: string) {
//     const host = new URL(url).hostname;
//     return {
//         siteSetting: _sites[host],
//         globalSetting: !!getSetting("enabled"),
//     }
// }