import type { SpiderState } from 'shared';
import createWebCanvas from '../../shared/src/webCanvas';
import createWebSocket from '../../shared/src/webSocket';
import './style.css'

const WSS = "localhost:8787";

const canvas = document.getElementById("itsy-bitsy-canvas") as HTMLCanvasElement;

const { stepAndDrawSpider, clearCanvas, setPixelScale, transformPointToCanvas } = createWebCanvas(canvas);
const sock = createWebSocket(WSS);

// NOT NEEDED YET
sock.send("init", {});

const spiders: Map<string, SpiderState> = new Map();
const me: SpiderState = createSpiderState();

let prev: number;
requestAnimationFrame(function update(timestamp: number) {
    if (!prev) {
        prev = timestamp;
        requestAnimationFrame(update);
        return;
    }

    const delta = timestamp - prev;
    prev = timestamp;

    clearCanvas();
    for (const spider of spiders.values()) {
        stepAndDrawSpider(delta, spider);
    }
    stepAndDrawSpider(delta, me);

    requestAnimationFrame(update);
});

sock.listen("init", (e) => {
    e.connections.forEach(c => {
        spiders.set(c.id, createSpiderState({
            targets: c.points.map(p => transformPointToCanvas(p)),
        }));
    });
});

sock.listen("join", (e) => {
    spiders.set(e.id, createSpiderState());
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
});

// sock.listen("message", (e) => {
//
// });

document.addEventListener('mousemove', (e) => {
    processInput(e);
});

document.addEventListener("touchmove", (e) => {
    processInput(...e.touches);
});

function processInput(...points: { clientX: number, clientY: number }[]) {
    me.targets = points.map(p => transformPointToCanvas({
        x: p.clientX,
        y: p.clientY,
    }, {
        x: window.innerWidth,
        y: window.innerHeight,
    }));

    sock.send("move", { points: me.targets });
}

function createSpiderState(state: Partial<SpiderState> = {}) {
    const defaultState: SpiderState = {
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
    }
    return Object.assign(defaultState, state);
}

window.addEventListener("keydown", ({ key }) => {
    if (key === "ArrowRight") {
        setPixelScale(prev => prev * 2);
    }
    else if (key === "ArrowLeft") {
        setPixelScale(prev => prev / 2);
    }
    else if (key === "1") {
        spiders.set("ease", createSpiderState({
            current: transformPointToCanvas({ x: 0, y: 0}),
            targets: [transformPointToCanvas({ x: 1, y: 1})],
        }));
        setTimeout(() => {
            spiders.delete("ease");
        }, 1000);
    }
    else if (key === "2") {
        spiders.set("linear", createSpiderState({
            current: transformPointToCanvas({ x: 0, y: 0}),
            targets: [transformPointToCanvas({ x: 1, y: 1})],
            interpolation: {
                type: "linear",
                speed: 10,
            }
        }));
        setTimeout(() => {
            spiders.delete("linear");
        }, 5000);
    }
});