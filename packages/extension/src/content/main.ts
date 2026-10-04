import "./style.css";
import { AnimationController, createWebCanvas } from 'shared/client';
import { randomInRange, type SpiderState } from "shared";

const canvas = document.createElement("canvas");
canvas.id = "itsy-bitsy-canvas";
document.body.appendChild(canvas);

const { stepAndDrawSpider, clearCanvas, transformPointToCanvas, setPixelScale, getCanvasSize } = createWebCanvas(canvas);

// window.addEventListener("scroll", (e) => {
//     spiders should translate up/down the page?
//     idk, maybe too much for now
// });

function spawnSpider() {
    const i1 = Math.floor(Math.random() + 0.5);
    const i2 = Math.floor(Math.random() + 0.5);
    const points = [[1.5, -0.5], [Math.random(), Math.random()]];

    const interpolation: SpiderState["interpolation"] = Math.random() > 0.5 ? {
        type: "ease",
        halfLife: Math.random() * 400 + 100,
    } : {
        type: "linear",
        speed: Math.random() * 2 + 1,
    }

    spiders.push({
        id: "new-spider-" + Math.random().toFixed(10),
        current: transformPointToCanvas({
            x: points[i1][i2],
            y: points[1 - i1][i2],
        }),
        targets: [transformPointToCanvas({
            x: points[i1][1 - i2],
            y: points[1 - i1][1 - i2],
        })],
        targetPadding: 0,
        interpolation,
        feet: [],
        angle: 0,
        headPosition: {
            x: 0,
            y: 0,
        },
        scale: randomInRange(0.5, 1.5),
        kissing: true,
    });
}

const spiders: SpiderState[] = [];
let nextSpiderTime = 2000;

new AnimationController(({ timestamp, delta }) => {

    if (timestamp > nextSpiderTime) {
        nextSpiderTime = timestamp + (Math.random() > 0.1 ? Math.random() * 1000 + 1000 : 100);
        spawnSpider();
    }

    clearCanvas();
    spiders.forEach(spider => stepAndDrawSpider(delta, timestamp, spider));

    for (let i = spiders.length - 1; i > -1; i--) {
        if (
            spiders[i].targets[0].x < 0 && spiders[i].current.x < 0
            || spiders[i].targets[0].y < 0 && spiders[i].current.y < 0
            || spiders[i].targets[0].x > getCanvasSize().x && spiders[i].current.x > getCanvasSize().x
            || spiders[i].targets[0].y > getCanvasSize().y && spiders[i].current.y > getCanvasSize().y

        ) {
            spiders.splice(i, 1);
        }
    }

    return true;
}).playIfPaused();

window.addEventListener("keydown", ({ key }) => {
    if (key === "ArrowRight") {
        setPixelScale(prev => prev * 2);
    }
    else if (key === "ArrowLeft") {
        setPixelScale(prev => prev / 2);
    }
});