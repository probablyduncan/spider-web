import { ExtensionSettings, getSetting, isSetting, resetSetting, setSetting } from '@/shared/settings';
import './config.css';

let hostname = "";
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    hostname = new URL(tabs[0].url ?? "").hostname.replace(/^www./, "");
    document.querySelectorAll<HTMLElement>("[data-hostname]").forEach(e => e.innerText = hostname);
    return true;
});

const reset = document.querySelector<HTMLButtonElement>(`button#reset`);

document.querySelectorAll<HTMLInputElement>(`input[type="radio"]`).forEach(radio => {
    const key = radio.name as keyof ExtensionSettings;
    if (!isSetting(key)) {
        return;
    }

    radio.checked = (radio.value === getSetting(key).toString());
    radio.addEventListener("input", () => {
        setSetting(key, parseInt(radio.value));
    });

    reset?.addEventListener("click", (e) => {
        const defaultValue = resetSetting(key)
        radio.checked = (radio.value === defaultValue.toString());
        e.preventDefault();
    });
});

document.querySelectorAll<HTMLInputElement>(`input[type="range"]`).forEach(range => {
    const key = range.name as keyof ExtensionSettings;
    if (!isSetting(key)) {
        return;
    }

    range.value = getSetting(key).toString();
    range.addEventListener("input", () => {
        setSetting(key, parseInt(range.value));

    });
});

document.querySelector<HTMLButtonElement>("button#add-spider")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach(({ id }) => chrome.tabs.sendMessage(id ?? 0, { type: "add-spider" }));
        return true;
    });
});

document.querySelector<HTMLButtonElement>("button#toggle-yours")?.addEventListener("click", (e) => {
    const value = getSetting("mineEnabled");
    (e.target as HTMLElement).innerText = value ? "SHOW YOURS" : "HIDE YOURS";
    setSetting("mineEnabled", 1 - getSetting("mineEnabled"));
});

document.querySelector<HTMLButtonElement>("button#clear-spiders")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach(({ id }) => chrome.tabs.sendMessage(id ?? 0, { type: "clear-spiders" }));
        return true;
    });
});