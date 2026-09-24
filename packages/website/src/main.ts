import { AnimationFrameController, SpiderController } from 'shared/render'
import './style.css'
import { createSpiderSocket } from 'shared'

let guid = localStorage.getItem('guid')
if (!guid) {
    guid = crypto.randomUUID()
    localStorage.setItem('guid', guid)
}

// TODO: point this at the deployed Worker once it exists (e.g. server.<account>.workers.dev)
const SERVER_HOST = import.meta.env.DEV ? 'localhost:8787' : 'server.<account>.workers.dev'

const socket = createSpiderSocket({ host: SERVER_HOST, guid });

const canvas = document.querySelector<HTMLCanvasElement>("canvas#canvas")!;
const context = canvas.getContext("2d")!;

function scaleCanvasToWindow() {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

scaleCanvasToWindow();
window.addEventListener("resize", scaleCanvasToWindow);

const otherSpiders: Record<string, SpiderController> = {};

function createSpiderController() {
    const controller = new SpiderController();
    controller.target[0] = controller.current[0] = Math.random() > 0.5 ? -40 : window.innerWidth + 40;
    controller.target[1] = controller.current[1] = Math.random() > 0.5 ? -40 : window.innerHeight + 40;
    return controller;
}

const mySpider = createSpiderController();

socket.listen("init", ({ spiders }) => {
    spiders.forEach((guid) => {
        otherSpiders[guid] = createSpiderController();
    });
});

socket.listen("join", ({ guid }) => {
    otherSpiders[guid] = createSpiderController();
});

new AnimationFrameController((deltaMS) => {
    clearCanvas();

    Object.values(otherSpiders).forEach(s => {
        s.step(deltaMS);
        s.draw(context);
    });

    mySpider.step(deltaMS);
    mySpider.draw(context);

    return true;
}).playIfPaused();

document.addEventListener('mousemove', (e) => {
    mySpider.target[0] = e.clientX;
    mySpider.target[1] = e.clientY;
    socket.send("spider", { x: e.clientX / window.innerWidth, y: e.clientY / window.innerWidth });
});

socket.listen("spider", ({ guid, x, y }) => {
    const controller = otherSpiders[guid];
    if (!controller) {
        return;
    }

    controller.target[0] = x * window.innerWidth;
    controller.target[1] = y * window.innerHeight;
});