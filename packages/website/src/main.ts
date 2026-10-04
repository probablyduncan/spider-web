import type { Point, SpiderState } from 'shared';
import createWebCanvas from '../../shared/src/webCanvas';
import createWebSocket from '../../shared/src/webSocket';
import createWebStepper from '../../shared/src/webStepper';
import './style.css'

const WSS = "localhost:8787";

const canvas = document.getElementById("itsy-bitsy-canvas") as HTMLCanvasElement;

const draw = createWebCanvas(canvas);
const step = createWebStepper();
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

    const spidersToRender = step(delta, [...spiders.values(), me]);
    draw(spidersToRender);
    requestAnimationFrame(update);
});

sock.listen("init", (e) => {
    e.connections.forEach(c => {
        spiders.set(c.id, createSpiderState({ targets: c.points }));
    });
});

sock.listen("join", (e) => {
    spiders.set(e.id, createSpiderState())
});

sock.listen("move", (e) => {
    const state = spiders.get(e.id);
    if (!state) {
        return;
    }
    state.targets = e.points;
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
    me.targets = points.map(mouseEventToLerp);
    sock.send("move", { points: me.targets });
}

function createSpiderState(state: Partial<SpiderState> = {}) {
    const defaultState: SpiderState = {
        targets: [],
        targetPadding: 0,
        feet: [],
        interpolation: {
            type: "ease",
            halfLife: 100,
        },
    }
    return Object.assign(defaultState, state);
}

function mouseEventToPoint(e: { clientX: number, clientY: number }) {
    return { x: e.clientX, y: e.clientY };
}

function mouseEventToLerp(e: { clientX: number, clientY: number }) {
    return { x: e.clientX / canvas.clientWidth, y: e.clientY / canvas.clientHeight };
}

function toPixels(point: Point) {
    return { x: point.x * canvas.clientWidth, y: point.y * canvas.clientHeight };
}

function toLerp(point: Point) {
    return { x: point.x / canvas.clientWidth, y: point.y / canvas.clientHeight };
}