import "./style.css";
import { getPointAroundBox, getPointsAcrossBox, isAlmostZero, randomInRange } from "shared/math";
import { getSetting, onSettingChange } from "@/shared/settings";
import { createWebCanvas } from "shared/webCanvas";
import { SpiderState } from "shared/types";
import { AnimationController } from "shared/animationController";

const canvas = document.createElement("canvas");
canvas.id = "itsy-bitsy-canvas";
document.body.appendChild(canvas);

const { stepAndDrawSpider, clearCanvas, setPixelScale, getCanvasSize, transformPointToCanvas } = createWebCanvas(canvas);

{
    // slide spiders around on scroll
    let prevScroll: number = window.scrollY;
    window.addEventListener("scroll", () => {
        const delta = window.scrollY - prevScroll * getCanvasSize().y / window.innerHeight;
        prevScroll = window.scrollY;
        spiders.forEach(s => {
            s.targets[0].y += delta / 16;
            s.current.y -= delta;
        });
        me.current.y -= delta;
    });
}

chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case "add-spider":
            spawnSpider();
            break;
        case "clear-spiders":
            spiders.length = 0;
            break;
    }
});

window.addEventListener("mousemove", (e) => {
    me.targets[0] = transformPointToCanvas({
        x: e.clientX,
        y: e.clientY,
    }, {
        x: window.innerWidth,
        y: window.innerHeight,
    });
});

document.addEventListener("mousedown", () => {
    me.scale /= 1.2;
    //@ts-ignore
    me.interpolation.halfLife = 10000;
});

document.addEventListener("mouseup", () => {
    me.scale *= 1.2;
    //@ts-ignore
    me.interpolation.halfLife = 100;
});

document.addEventListener('visibilitychange', () => {
    switch (document.visibilityState) {
        case "visible":
            queueSpider();
            break;
        case "hidden":
            clearTimeout(nextSpiderTimeoutId);
            break;
    }
});

function spawnSpider() {
    const scale = getRandomSize();
    const [current, target] = getPointsAcrossBox(getCanvasSize(), 100 * scale);

    const interpolation: SpiderState["interpolation"] = Math.random() > 0.5 ? {
        type: "ease",
        halfLife: randomInRange(100, 500),
    } : {
        type: "linear",
        speed: randomInRange(1, 5),
    }

    spiders.push({
        id: "new-spider-" + Math.random().toFixed(10),
        current: current,
        targets: [target],
        targetPadding: 0,
        interpolation,
        feet: [],
        angle: 0,
        headPosition: {
            x: 0,
            y: 0,
        },
        scale,
        kissing: true,
    });

    animationController.playIfPaused();
}

function getRandomSize() {
    const config = getSetting("interloperSize");
    switch (config) {
        case 0:
            return randomInRange(0.4, 0.6);
        case 1:
            return randomInRange(0.75, 1.2);
        case 2:
            return randomInRange(1, 2);
        case 3:
            return randomInRange(2, 4);
        case 4:
            return randomInRange(5, 20);
        default:
            return 1;
    }
}

let nextSpiderTimeoutId: number = 0;
function queueSpider() {

    if (nextSpiderTimeoutId) {
        clearTimeout(nextSpiderTimeoutId);
    }

    const frequency = getSetting("interloperFrequency");
    let timeout: number = 1000;
    switch (frequency) {
        case 0:
            return;
        case 1:
            timeout = randomInRange(120_000, 1_200_000);
            break;
        case 2:
            timeout = randomInRange(10_000, 240_000);
            break;
        case 3:
            timeout = randomInRange(100, 2_000);
            break;
        case 4:
            timeout = randomInRange(1, 100);
            break;
    }

    console.log("next spider in", timeout / 1000, "seconds");
    nextSpiderTimeoutId = setTimeout(() => {
        spawnSpider();
        if (Math.random() > 0.9 || timeout < 100) {
            // crazy! two!
            spawnSpider();
        }
        queueSpider();
    }, timeout);
}
queueSpider();

const spiders: SpiderState[] = [];
const me: SpiderState = {
    angle: 0,
    current: { x: -100, y: -100 },
    feet: [],
    headPosition: { x: 0, y: 0 },
    id: "me",
    interpolation: {
        type: "ease",
        halfLife: 100,
    },
    kissing: false,
    scale: 1,
    targets: [],
    targetPadding: 20,
}
let meEnabled = !!getSetting("mineEnabled");

const animationController = new AnimationController(({ timestamp, delta }) => {

    // draw
    clearCanvas();
    spiders.forEach(spider => stepAndDrawSpider(delta, timestamp, spider));
    if (meEnabled) {
        stepAndDrawSpider(delta, timestamp, me);
    }

    // remove spiders that are offscreen
    for (let i = spiders.length - 1; i > -1; i--) {
        const deleteThreshold = 80 * spiders[i].scale;
        if (
            (spiders[i].targets[0].x < -deleteThreshold
                && spiders[i].current.x < -deleteThreshold)
            || (spiders[i].targets[0].y < -deleteThreshold
                && spiders[i].current.y < -deleteThreshold)
            || (spiders[i].targets[0].x > getCanvasSize().x + deleteThreshold
                && spiders[i].current.x > getCanvasSize().x + deleteThreshold)
            || (spiders[i].targets[0].y > getCanvasSize().y + deleteThreshold
                && spiders[i].current.y > getCanvasSize().y + deleteThreshold)
        ) {
            // delete spider if offscreen
            spiders.splice(i, 1);
            continue;
        }
    }

    // only continue if there are spiders!
    if (!spiders.length && !meEnabled) {
        console.log("no more spiders! stopping animation");
        return false;
    }

    return true;
});

onSettingChange("resolution", (value) => {
    switch (value) {
        case 0:
            setPixelScale(1);
            break;
        case 1:
            setPixelScale(4);
            break;
        case 2:
            setPixelScale(8);
            break;
        case 3:
            setPixelScale(16);
            break;
    }
});

onSettingChange("interloperFrequency", (value) => {
    if (nextSpiderTimeoutId) {
        clearTimeout(nextSpiderTimeoutId);
    }
    if (value > 0) {
        queueSpider();
    }
});

onSettingChange("mineEnabled", (value) => {
    meEnabled = !!value;
    if (meEnabled) {
        animationController.playIfPaused();
    }
});