import './style.css'
import { angleDifference, getPointAroundBox, getPointsAcrossBox, isAlmostZero, midpoint, numberToEnglish, randomInRange } from 'shared/math';
import type { HeartState, SpiderState } from 'shared/types';
import { createWebSocket } from "shared/webSocket"
import { createWebCanvas } from "shared/webCanvas"
import { AnimationController } from 'shared/animationController';

const canvas = document.getElementById("itsy-bitsy-canvas") as HTMLCanvasElement;
const { stepAndDrawSpider, stepAndDrawHeart, clearCanvas, setPixelScale, transformPointToCanvas, getCanvasSize } = createWebCanvas(canvas);

const WSS = import.meta.env.VITE_WS_HOST as string;
const sock = createWebSocket(WSS);

const spiders: Map<string, SpiderState> = new Map();

const me: SpiderState = createSpiderState({
    id: "me",
});

const updateCursor = (() => {
    let cursorHidden = false;
    return (state: "show" | "hide") => {
        if (cursorHidden === (state === "hide")) {
            return;
        }
        cursorHidden = (state === "hide");
        document.body.classList.toggle("no-cursor", cursorHidden);
    }
})();

const updateNumConnectionsDisplay = (() => {
    const multilineTextElements = document.querySelectorAll(`[data-others-long]`);
    const shortTextElements = document.querySelectorAll(`[data-others-short]`);
    const numberElements = document.querySelectorAll(`[data-others-num]`);
    return () => {
        console.log(spiders);

        let numConnections = 0;
        for (const spider of spiders.values()) {

            // don't count local
            if (spider.id === "" || spider.id === "me") {
                continue;
            }

            // don't count before first interaction
            if (!spider.targets.length) {
                continue;
            }

            // don't count offscreen
            // const deleteThreshold = 80 * spider.scale;
            // if (
            //     (spider.targets[0].x < -deleteThreshold
            //         && spider.current.x < -deleteThreshold)
            //     || (spider.targets[0].y < -deleteThreshold
            //         && spider.current.y < -deleteThreshold)
            //     || (spider.targets[0].x > getCanvasSize().x + deleteThreshold
            //         && spider.current.x > getCanvasSize().x + deleteThreshold)
            //     || (spider.targets[0].y > getCanvasSize().y + deleteThreshold
            //         && spider.current.y > getCanvasSize().y + deleteThreshold)
            // ) {
            //     continue;
            // }

            numConnections++;
        }
        
        const englishNumber = numberToEnglish(numConnections);
        let countHtml;
        let belowHtml;
        switch (numConnections) {
            case 0:
                countHtml = `There are <b>no other spiders here</b>.`;
                belowHtml = `You are <b>alone</b>.`;
                break;
            case 1:
                countHtml = `There is <b>1 other spider here</b>.`;
                belowHtml = `Say hello!`;
                break;
            default:
                countHtml = `There are <b>${numberToEnglish(numConnections)}</b> other spiders here.`;
                belowHtml = `Say hello!`;
                break;

        }

        multilineTextElements.forEach(e => e.innerHTML = countHtml + "<br/>" + belowHtml);
        shortTextElements.forEach(e => e.innerHTML = countHtml);
        numberElements.forEach(e => e.innerHTML = englishNumber);
    }
})();

const kissingConfig = {
    startAfterTime: 2_000,
    kissForTime: 5_000,
    cooldownTime: 20_000,
    heartDuration: 1_000,
    frequency: 500,
    needToBeFacingThisMuch: 0.5,
    needToBeThisCloseToKiss: 20,
} as const;

const kisses = new Map<HeartState["key"], number>();
const hearts: HeartState[] = [];

new AnimationController(({ delta, timestamp }) => {
    clearCanvas();

    const spidersArray = [...spiders.values(), me];
    for (let i = 0; i < spidersArray.length; i++) {
        stepAndDrawSpider(delta, timestamp, spidersArray[i]);
    }

    for (let i = 0; i < spidersArray.length; i++) {
        const kisser = spidersArray[i];
        for (let j = i + 1; j < spidersArray.length; j++) {
            const kissee = spidersArray[j];
            const key: HeartState["key"] = `${kisser.id}+${kissee.id}=4ever`;

            const difference = {
                x: kisser.headPosition.x - kissee.headPosition.x,
                y: kisser.headPosition.y - kissee.headPosition.y,
            };

            const canKiss = angleDifference(kisser.angle, kissee.angle) > kissingConfig.needToBeFacingThisMuch
                && isAlmostZero(difference, kissingConfig.needToBeThisCloseToKiss);

            function cleanUpState() {
                kisser.kissing = false;
                kissee.kissing = false;
                if (kisser.id === "me" || kissee.id === "me") {
                    updateCursor("show");
                }
            }

            // not close enough to kiss
            if (!canKiss) {
                if (kisses.has(key)) {
                    clearTimeout(kisses.get(key));
                    kisses.delete(key);
                    cleanUpState();
                }

                continue;
            }

            if (kisser.id === "me" || kissee.id === "me") {
                updateCursor("hide");
            }

            // close enough to kiss, but haven't started yet
            if (!kisses.has(key)) {

                const interestAngle = midpoint(kisser.angle, kissee.angle);

                // ok we're interested
                for (let h = 0; h < 3; h++) {
                    hearts.push({
                        key,
                        center: {
                            x: kissee.headPosition.x + difference.x / 2 + Math.random() * 10 - 5,
                            y: kissee.headPosition.y + difference.y / 2 + Math.random() * 10 - 5,
                        },
                        char: "?",
                        angle: interestAngle - (Math.random() > 0.34 ? Math.PI : 0),
                        delay: h * 100,
                        size: 20,
                        duration: kissingConfig.heartDuration,
                        progress: 0,
                    });
                }

                // start kissing after a certain amount of time
                kisses.set(key, setTimeout(() => {

                    kisser.kissing = true;
                    kissee.kissing = true;

                    for (let h = 0; h < kissingConfig.kissForTime / 500; h++) {
                        hearts.push({
                            key,
                            center: {
                                x: kissee.headPosition.x + difference.x / 2 + randomInRange(-10, 10),
                                y: kissee.headPosition.y + difference.y / 2 + randomInRange(-5, 5),
                            },
                            char: ["❤️", "💖", "❤️", "❤️‍🔥"][Math.floor(Math.random() * 4)],
                            angle: randomInRange(-0.5, 0.5) - Math.PI / 2,
                            delay: kissingConfig.kissForTime * Math.pow(Math.random(), 2),
                            size: randomInRange(8, 24),
                            duration: kissingConfig.heartDuration,
                            progress: 0,
                        });
                    }

                    kisses.set(key, setTimeout(() => {

                        kisses.set(key, setTimeout(() => {
                            kisses.delete(key);
                        }, kissingConfig.cooldownTime));

                        cleanUpState();

                        const babyKey = "baby-" + Math.random().toFixed(10);
                        spiders.set(babyKey, createSpiderState({
                            id: "",
                            current: { ...Math.random() > 0.5 ? kisser.current : kissee.current },
                            targets: [getPointAroundBox(getCanvasSize(), 200)],
                            interpolation: {
                                type: "ease",
                                halfLife: 500,
                            },
                            scale: (kisser.scale + kissee.scale) / 3,
                        }));
                    }, kissingConfig.kissForTime));
                }, kissingConfig.startAfterTime));
            }

        }
    }

    for (let i = hearts.length - 1; i > -1; i--) {
        const heart = hearts[i];

        // remove if fully elapsed or if we've stopped kissing and this heart hasn't started yet
        if (heart.progress >= heart.duration || (heart.progress <= 0 && !kisses.has(heart.key))) {
            hearts.splice(i, 1);
        }
        else {
            stepAndDrawHeart(delta, hearts[i])
        }
    }

    return true;
}).playIfPaused();

sock.listen("init", (e) => {
    e.connections.forEach(c => {
        spiders.set(c.id, createSpiderState({
            id: c.id,
            targets: c.points.map(p => transformPointToCanvas(p)),
        }));
    });
    updateNumConnectionsDisplay();
});

sock.listen("join", (e) => {
    spiders.set(e.id, createSpiderState({
        id: e.id,
    }));
    updateNumConnectionsDisplay();
});

sock.listen("move", (e) => {
    const state = spiders.get(e.id);
    if (!state) {
        return;
    }
    state.targets = e.points.map(p => transformPointToCanvas(p));
});

sock.listen("leave", (e) => {
    spiders.delete(e.id);
    updateNumConnectionsDisplay();
});

// sock.listen("message", (e) => {
//
// });

document.addEventListener('mousemove', (e) => {
    processInput(e);
});

document.addEventListener("mousedown", (e) => {
    me.scale = 0.8;
    //@ts-ignore
    me.interpolation.halfLife = 5000;
});

document.addEventListener("mouseup", () => {
    me.scale = 1;
    //@ts-ignore
    me.interpolation.halfLife = 100;
});

document.addEventListener("mouseleave", () => {
    me.scale = 1;
    //@ts-ignore
    me.interpolation.halfLife = 100;
});

document.addEventListener("touchmove", (e) => {
    processInput(...e.touches);
});

document.addEventListener("touchstart", (e) => {
    processInput(...e.touches);
});

document.addEventListener("touchend", (e) => {
    if (me.targets.length > 1) {
        me.targets = [me.targets[0]];
    }
});

function processInput(...touches: { clientX: number, clientY: number }[]) {
    const points = touches.map(t => ({
        x: t.clientX / window.innerWidth,
        y: t.clientY / window.innerHeight,
    }));

    me.targets = points.map(p => transformPointToCanvas(p));
    sock.send("move", { points });
}

function createSpiderState(state: Partial<SpiderState> & Pick<SpiderState, "id">) {
    const defaultState: SpiderState = {
        id: "",
        targets: [],
        current: {
            x: 0,
            y: 0,
        },
        targetPadding: 20,
        feet: [],
        interpolation: {
            type: "ease",
            halfLife: 100,
        },
        angle: 0,
        headPosition: {
            x: 0,
            y: 0,
        },
        scale: 1,
        kissing: false,
    }
    return Object.assign(defaultState, state);
}

let prevKey = "";
window.addEventListener("keydown", ({ key }) => {
    if (key === "ArrowRight") {
        setPixelScale(prev => prev * 2);
    }
    else if (key === "ArrowLeft") {
        setPixelScale(prev => prev / 2);
    }
    else if (key === "i") {
        document.querySelector<HTMLDialogElement>("dialog#info")?.showModal();
    }
    else if (key === "r" && prevKey == "q") {
        document.querySelector<HTMLElement>("#qr")?.classList.toggle("hidden");
    }
    else if (key === "Escape") {
        document.querySelector<HTMLElement>("#qr")?.classList.add("hidden");
    }
    else if (key === "1") {
        const points = getPointsAcrossBox(getCanvasSize(), 100);
        const id = "ease-" + Math.random().toFixed(10);
        spiders.set(id, createSpiderState({
            id: "",
            current: points[0],
            targets: [points[1]],
            scale: randomInRange(0.5, 1.5),
        }));
        setTimeout(() => {
            spiders.delete(id);
        }, 5000);
    }
    else if (key === "2") {
        const points = getPointsAcrossBox(getCanvasSize(), 40);
        const id = "linear-" + Math.random().toFixed(10);
        spiders.set(id, createSpiderState({
            id: "",
            current: points[0],
            targets: [points[1]],
            interpolation: {
                type: "linear",
                speed: 3,
            },
            scale: randomInRange(0.5, 1.5),
        }));
        setTimeout(() => {
            //@ts-ignore
            spiders.get(id).interpolation.speed = 0;
        }, 5000);
    }

    prevKey = key;
});