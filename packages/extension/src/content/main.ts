import "./style.css";
import createWebCanvas from '../../../shared/src/webCanvas';
import createWebSocket from '../../../shared/src/webSocket';
import createWebStepper from '../../../shared/src/webStepper';
import { SpiderState } from "shared";

const canvas = document.createElement("canvas");
canvas.id = "itsy-bitsy-canvas";
document.body.appendChild(canvas);

const draw = createWebCanvas(canvas);
const step = createWebStepper();

window.addEventListener("mousemove", (e) => {
    return;
    spider.targets = [{
        x: e.clientX / canvas.clientWidth,
        y: e.clientY / canvas.clientHeight,
    }]
});

// window.addEventListener("scroll", (e) => {
//     spiders should translate up/down the page?
//     idk, maybe too much for now
// });

const spider: SpiderState = {
    targets: [],
    targetPadding: 0.01,
    feet: [],
    interpolation: {
        type: "ease",
        halfLife: 100,
    },
};

function spawnSpider() {
    const i1 = Math.floor(Math.random() + 0.5);
    const i2 = Math.floor(Math.random() + 0.5);
    const points = [[1.5, -0.5], [Math.random(), Math.random()]];

    const interpolation: SpiderState["interpolation"] = Math.random() > 0.5 ? {
        type: "ease",
        halfLife: Math.random() * 400 + 100,
    } : {
        type: "linear",
        speed: Math.random() * 0.08 + 0.001,
    }

    spiders.push({
        current: {
            x: points[i1][i2],
            y: points[1 - i1][i2],
        },
        targets: [{
            x: points[i1][1 - i2],
            y: points[1 - i1][1 - i2],
        }],
        targetPadding: 0,
        feet: [],
        interpolation,
    });
}

const spiders: SpiderState[] = [];
let nextSpiderTime = 2000;

let prev: number;
requestAnimationFrame(function update(timestamp: number) {
    if (!prev) {
        prev = timestamp;
        requestAnimationFrame(update);
        return;
    }

    const delta = timestamp - prev;
    prev = timestamp;

    if (timestamp > nextSpiderTime) {
        nextSpiderTime = timestamp + (Math.random() > 0.1 ? Math.random() * 1000 + 1000 : 100);
        spawnSpider();
    }

    const spidersToRender = step(delta, [...spiders, spider]);
    draw(spidersToRender);

    for (let i = spiders.length - 1; i > -1; i--) {
        if (
            spiders[i].targets[0].x < 0 && spiders[i].current!.x < 0
            || spiders[i].targets[0].y < 0 && spiders[i].current!.y < 0
            || spiders[i].targets[0].x > 1 && spiders[i].current!.x > 1
            || spiders[i].targets[0].y > 1 && spiders[i].current!.y > 1

        ) {
            spiders.splice(i, 1);
        }
    }

    requestAnimationFrame(update);
});