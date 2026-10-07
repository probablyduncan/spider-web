import { ExtensionSettings, getSetting, isSetting, resetSetting, setSetting } from '@/shared/settings';
import './config.css';
// import { AnimationController } from 'shared/animationController';
// import { createWebCanvas } from 'shared/webCanvas';
// import { isAlmostZero } from 'shared/math';
// import { Point, SpiderState } from 'shared/types';

const reset = document.querySelector<HTMLButtonElement>(`button#reset`);

document.querySelectorAll<HTMLInputElement>(`input[type="radio"]`).forEach(radio => {
    const key = radio.name as keyof ExtensionSettings;
    if (!isSetting(key)) {
        return;
    }

    radio.checked = (radio.value === getSetting(key).toString());
    radio.addEventListener("input", () => {
        setSetting(key, parseInt(radio.value));
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log("", tabs);
            return true;
        });
    });

    reset?.addEventListener("click", (e) => {
        const defaultValue = resetSetting(key)
        radio.checked = (radio.value === defaultValue.toString());
        e.preventDefault();
    });
});

document.querySelector<HTMLButtonElement>("button#add-spider")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach(({ id }) => chrome.tabs.sendMessage(id ?? 0, { type: "add-spider" }));
        return true;
    });
});

document.querySelector<HTMLButtonElement>("button#clear-spiders")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach(({ id }) => chrome.tabs.sendMessage(id ?? 0, { type: "clear-spiders" }));
        return true;
    });
});

const enableGloballyCheckbox = document.querySelector<HTMLInputElement>(`input[type="checkbox"][name="enable-globally"]`);
if (enableGloballyCheckbox) {
    enableGloballyCheckbox.checked = !!getSetting("enabled");
    enableGloballyCheckbox?.addEventListener("click", () => {
        setSetting("enabled", enableGloballyCheckbox?.checked ? 1 : 0);
    })
}

window.addEventListener("mouseout", () => {
    // use this to spawn spider when we get it out of its little cage
});

// document.querySelectorAll<HTMLElement>("[data-spider-slider]").forEach(wrapper => {

//     const input = wrapper.querySelector("input")!;
//     const canvas = wrapper.querySelector("canvas")!;

//     const canvasDOMRect = canvas.getBoundingClientRect();
//     const { clearCanvas, getCanvasSize, setPixelScale, stepAndDrawSpider } = createWebCanvas(canvas);

//     function getPointOnCanvas(x: number, y: number) {
//         return {
//             x: getCanvasSize().x * ((x - canvasDOMRect.left) / canvasDOMRect.width),
//             y: getCanvasSize().y * ((y - canvasDOMRect.top) / canvasDOMRect.height)
//         }
//     }

//     function leftPosition() {
//         return {
//             x: getCanvasSize().y / 2,
//             y: getCanvasSize().y / 2,
//         }
//     }

//     function rightPosition() {
//         return {
//             x: getCanvasSize().x - getCanvasSize().y / 2,
//             y: getCanvasSize().y / 2,
//         }
//     }

//     const spider: SpiderState = {
//         angle: Math.PI / 4,
//         current: leftPosition(),
//         feet: [],
//         headPosition: { x: 0, y: 0 },
//         id: "",
//         interpolation: {
//             type: "ease",
//             halfLife: 100,
//         },
//         kissing: false,
//         scale: 1,
//         targets: [leftPosition()],
//         targetPadding: 0,
//     }

//     // const mousePosition = { x: getCanvasSize().x / 2, y: getCanvasSize().y / 2 };

//     const animationController = new AnimationController(({ delta, timestamp }) => {
//         clearCanvas();
//         stepAndDrawSpider(delta, timestamp, spider);
//         return true;
//     });
//     animationController.playIfPaused();

//     input.addEventListener("mousedown", (e) => {
//         animationController.playIfPaused();
//         const abortController = new AbortController();
//         function onLeave() {
//             abortController.abort();
//             const left = spider.targets[0].x < getCanvasSize().x / 2;
//             spider.targets.length = 0;
//             spider.targets[0] = left ? { ...leftPosition() } : { ...rightPosition() };
//             input.value = left ? "0" : "1";
//             spider.scale = 1;
//         }

//         window.addEventListener("mouseup", onLeave, { once: true });
//         window.addEventListener("mouseleave", onLeave, { once: true });
//         window.addEventListener("mouseout", onLeave, { once: true });

//         window.addEventListener("mousemove", (e) => {
//             // spider.targets = [
//             //     getPointOnCanvas(e.clientX, e.clientY)
//             // ];
//             const thisPoint = getPointOnCanvas(e.clientX, e.clientY);
//             const distToCenter = Math.max(0, 1 - Math.abs(thisPoint.x * 2 / getCanvasSize().x - 1));
//             spider.scale = 1 + distToCenter;
//             spider.targets = [thisPoint];
//             // spider.targets = [
//             //     getPointOnCanvas(e.clientX, e.clientY + spread),
//             //     getPointOnCanvas(e.clientX, e.clientY - spread),
//             // ]
//         }, {
//             signal: abortController.signal,
//         });
//     });
// });