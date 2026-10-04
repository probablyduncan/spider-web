import { Point, RenderableSpider } from "./types";

// ok two things:
// - combine this with the stepper, I think?
//   this will make handling canvas size/pixels much easier
// - legs! just a basic implementation, nothing too crazy is necessary
// - maybe I should add spider size, that would make legs doable without using px I think

export default function createWebCanvas(canvas: HTMLCanvasElement) {
    const context = canvas?.getContext("2d") as CanvasRenderingContext2D;

    if (!canvas || !context) {
        throw "uh oh! canvas problems!"
    }

    const canvasSize: Point = {
        x: canvas.clientWidth,
        y: canvas.clientHeight,
    }

    function scaleCanvasToWindow() {
        const dpr = (window.devicePixelRatio || 1) / 4;
        canvasSize.x = canvas.clientWidth;
        canvasSize.y = canvas.clientHeight;
        canvas.width = canvasSize.x * dpr;
        canvas.height = canvasSize.y * dpr;
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

    function lerpPointToCanvasPoint(point: Point) {
        return {
            x: point.x * canvasSize.x,
            y: point.y * canvasSize.y,
        }
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

        const center = lerpPointToCanvasPoint(spider.center);

        // draw legs!!!
        for (const leg of spider.legs) {
            const hip = lerpPointToCanvasPoint(leg.hip);
            const knee = lerpPointToCanvasPoint(leg.knee);
            const foot = lerpPointToCanvasPoint(leg.foot)
            drawLine(hip, knee, "black", 4);
            drawLine(knee, foot, "black", 2);
        }

        // body
        drawCircle(center, 3, "black");

        // head
        const headPos = getPointAt(center, 5, spider.angle);
        drawCircle(headPos, 3, "black");

        // thorax
        const thoraxPos = getPointAt(center, -6, spider.angle);
        drawCircle(thoraxPos, 6, "black");
        context.fill();

        // eyes
        const eyeAngle = 0.42;  // 25 deg ish
        const leftEyePos = getPointAt(center, 5, spider.angle - eyeAngle);
        const rightEyePos = getPointAt(center, 5, spider.angle + eyeAngle);

        // whites, with black outlines
        drawCircle(leftEyePos, 2, "white", "black");
        drawCircle(rightEyePos, 2, "white", "black");

        // pupils
        drawCircle(leftEyePos, 1, "black");
        drawCircle(rightEyePos, 1, "black");
    }

    function draw(spiders: RenderableSpider[]) {
        context.clearRect(0, 0, canvasSize.x, canvasSize.y);
        // drawCircle(lerpPointToCanvasPoint({ x: 0.5, y: 0.5 }), 20, "green");
        // drawCircle(lerpPointToCanvasPoint({ x: 0, y: 0 }), 20, "blue");
        // drawCircle(lerpPointToCanvasPoint({ x: 1, y: 1 }), 20, "red");
        spiders.forEach(drawSpider);
    }

    return draw;
}
