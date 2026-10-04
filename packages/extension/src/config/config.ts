import { ExtensionSettings, getSetting, isSetting, resetSetting, setSetting } from '@/shared/settings';
import './config.css';

const reset = document.querySelector<HTMLButtonElement>(`button[type="reset"]`);
const inputs = document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"]`);
inputs.forEach(input => {
    const label = input.closest("label");
    console.log(input);
    console.log(label);

    const key = input.name as keyof ExtensionSettings;
    if (!isSetting(key)) {
        return;
    }

    input.checked = getSetting(key);
    input.addEventListener("change", () => {
        setSetting(key, input.checked);
    });

    reset?.addEventListener("click", () => {
        input.checked = resetSetting(key);
    });
});



function toggleForThisWebsite() {

}