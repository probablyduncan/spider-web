import { Point, RenderableSpider } from "./types";

// this is where we handle the canvas
// canvas should be scaled, 
// it should expose a render function, which 

export default function createWebCanvas(canvas: HTMLCanvasElement) {
    const context = canvas?.getContext("2d") as CanvasRenderingContext2D;

    if (!canvas || !context) {
        throw "uh oh! canvas problems!"
    }

    function scaleCanvasToWindow() {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
    }

    window.addEventListener("resize", scaleCanvasToWindow);
    scaleCanvasToWindow();

    function drawLine(from: Point, to: Point, color: string, width: number) {
        context.strokeStyle = color;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.closePath();
    }

    function getPointAt(start: Point, length: number, angle: number): Point {
        return {
            x: start.x + Math.cos(angle) * length,
            y: start.y + Math.sin(angle) * length,
        }
    }

    function drawCircle(center: Point, radius: number, fillColor?: string, strokeColor?: string) {

        context.beginPath();
        context.arc(center.x, center.y, radius, 0, 2 * Math.PI);

        if (fillColor) {
            context.fillStyle = fillColor;
            context.fill();
        }

        if (strokeColor) {
            context.strokeStyle = strokeColor;
            context.stroke();
        }

        context.closePath();
    }

    function drawSpider(spider: RenderableSpider) {

        // draw legs!!!
        for (const leg of spider.legs) {
            drawLine(leg.hip, leg.knee, "black", 4);
            drawLine(leg.knee, leg.foot, "black", 2);
        }

        // body
        drawCircle(spider.center, 3, "black");

        // head
        const headPos = getPointAt(spider.center, 5, spider.angle);
        drawCircle(headPos, 3, "black");

        // thorax
        const thoraxPos = getPointAt(spider.center, -6, spider.angle);
        drawCircle(thoraxPos, 6, "black");
        context.fill();

        // eyes
        const eyeAngle = 0.42;  // 25 deg ish
        const leftEyePos = getPointAt(spider.center, 5, spider.angle - eyeAngle);
        const rightEyePos = getPointAt(spider.center, 5, spider.angle + eyeAngle);

        // whites, with black outlines
        drawCircle(leftEyePos, 2, "white", "black");
        drawCircle(rightEyePos, 2, "white", "black");

        // pupils
        drawCircle(leftEyePos, 1, "black");
        drawCircle(rightEyePos, 1, "black");
    }

    function draw(spiders: RenderableSpider[]) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        spiders.forEach(drawSpider);
    }

    return draw;
}