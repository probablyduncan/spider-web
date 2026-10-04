import { Point, SpiderState } from "./types";

// ok two things:
// - combine this with the stepper, I think?
//   this will make handling canvas size/pixels much easier
// - legs! just a basic implementation, nothing too crazy is necessary
// - maybe I should add spider size, that would make legs doable without using px I think
// - step and draw both need to be in px

export default function createWebCanvas(canvas: HTMLCanvasElement) {
    const context = canvas?.getContext("2d") as CanvasRenderingContext2D;

    if (!canvas || !context) {
        throw "uh oh! canvas problems!"
    }

    const canvasSize: Point = {
        x: canvas.clientWidth,
        y: canvas.clientHeight,
    }

    let pixelScale: number = 1;
    function setPixelScale(scale: number | ((prev: number) => number)) {
        if (typeof scale === "function") {
            pixelScale = scale(pixelScale);
        }
        else {
            pixelScale = scale;
        }
        pixelScale = Math.max(pixelScale, 1);
        scaleCanvasToWindow();
    }

    function scaleCanvasToWindow() {
        const dpr = (window.devicePixelRatio || 1) / pixelScale;
        canvasSize.x = canvas.clientWidth;
        canvasSize.y = canvas.clientHeight;
        canvas.width = canvasSize.x * dpr;
        canvas.height = canvasSize.y * dpr;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
    }

    window.addEventListener("resize", scaleCanvasToWindow);
    scaleCanvasToWindow();

    function getAverage(points: Point[]) {

        const result = {
            x: 0,
            y: 0,
        }

        if (!points.length) {
            return result;
        }

        points.forEach(({ x, y }) => {
            result.x += x;
            result.y += y;
        });

        result.x /= points.length;
        result.y /= points.length;

        return result;
    }

    function moreExtreme(x1: number, x2: number) {
        return Math.abs(x1) > Math.abs(x2) ? x1 : x2;
    }

    function lessExtreme(x1: number, x2: number) {
        return Math.abs(x1) > Math.abs(x2) ? x2 : x1;
    }

    function isAlmostZero(point: Point, threshold: number) {
        return Math.abs(point.x) < threshold && Math.abs(point.y) < threshold;
    }

    function transformPointToCanvas(point: Point, currentScale: Point = { x: 1, y: 1 }) {
        return {
            x: canvasSize.x * point.x / currentScale.x,
            y: canvasSize.y * point.y / currentScale.y,
        }
    }

    function toRads(degrees: number) {
        return degrees * Math.PI / 180;
    }

    function getPointAt(start: Point, length: number, angle: number): Point {
        return {
            x: start.x + Math.cos(angle) * length,
            y: start.y + Math.sin(angle) * length,
        }
    }

    function drawLine(from: Point, to: Point, color: string, width: number) {
        context.strokeStyle = color;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.closePath();
    }

    function drawCircle(center: Point, radius: number, fillColor?: string, stroke?: {
        color: string,
        width: number,
    }) {

        context.beginPath();
        context.arc(center.x, center.y, radius, 0, 2 * Math.PI);

        if (fillColor) {
            context.fillStyle = fillColor;
            context.fill();
        }

        if (stroke) {
            context.lineWidth = stroke.width;
            context.strokeStyle = stroke.color;
            context.stroke();
        }

        context.closePath();
    }

    const idealFeet = [
        {
            angle: toRads(20),
            length: 0.5,
            stretch: 0.4,
        },
        {
            angle: toRads(50),
            length: 0.5,
            stretch: 0.6,
        },
        {
            angle: toRads(90),
            length: 0.4,
            stretch: 0.5,
        },
        {
            angle: toRads(120),
            length: 0.4,
            stretch: 0.4,
        },
    ] as const;

    function stepAndDrawSpider(deltaMS: number, spider: SpiderState) {

        if (!spider.targets.length) {
            spider.targets.push({
                x: 0,
                y: 0,
            });
        }

        const target = getAverage(spider.targets);
        spider.current ??= target;
        const center = spider.current;

        // face target
        const angle = Math.atan2(target.y - center.y, target.x - center.x);

        // push target back a bit, away from cursor
        if (spider.targetPadding) {
            target.x -= spider.targetPadding * Math.cos(angle);
            target.y -= spider.targetPadding * Math.sin(angle);
        }

        // update current position
        switch (spider.interpolation.type) {
            case "linear":
                // can I make this a little more natural?
                const distanceToTravel = {
                    x: Math.cos(angle) * spider.interpolation.speed,
                    y: Math.sin(angle) * spider.interpolation.speed,
                };
                center.x += lessExtreme(target.x - center.x, distanceToTravel.x);
                center.y += lessExtreme(target.y - center.y, distanceToTravel.y);
                break;
            case "ease":
                const lerp = Math.min(1, 0.5 * deltaMS / spider.interpolation.halfLife);
                center.x += (target.x - center.x) * lerp;
                center.y += (target.y - center.y) * lerp;
                break;
        }

        // walk legs
        for (let i = 0; i < idealFeet.length * 2; i++) {

            const baseLegLength = 30;

            const footConfig = idealFeet[Math.floor(i / 2)];
            const side = (i % 2 === 0) ? 1 : -1;
            const idealFoot = getPointAt(spider.current, footConfig.length * baseLegLength, angle + footConfig.angle * side);
            
            // for testing ideal foot positions:
            // spider.feet[i] = idealFoot; continue;

            // if no foot, set to ideal
            if (spider.feet.length <= i || !spider.feet[i]) {
                spider.feet[i] = idealFoot;
                continue;
            }

            // need to get distance from current to ideal
            const distanceFromIdeal = Math.sqrt(
                Math.pow(spider.feet[i].x - idealFoot.x, 2) + Math.pow(spider.feet[i].y - idealFoot.y, 2)
            );

            if (distanceFromIdeal > baseLegLength * footConfig.stretch * (Math.random() * 0.2 + 0.9)) {
                spider.feet[i] = idealFoot;
            }
        }

        // ------------------- DRAW --------------------

        spider.feet.forEach(f => {
            drawLine(center, f, "black", 1);
        })

        // body
        drawCircle(center, 3, "black");

        // head
        const headPos = getPointAt(center, 5, angle);
        drawCircle(headPos, 3, "black");

        // thorax
        const thoraxPos = getPointAt(center, -6, angle);
        drawCircle(thoraxPos, 6, "black");
        context.fill();

        // eyes
        const eyeAngle = 0.42;  // 25 deg ish
        const leftEyePos = getPointAt(center, 5, angle - eyeAngle);
        const rightEyePos = getPointAt(center, 5, angle + eyeAngle);

        // whites, with black outlines
        drawCircle(leftEyePos, 2, "white", { color: "black", width: 1 });
        drawCircle(rightEyePos, 2, "white", { color: "black", width: 1 });

        // pupils
        drawCircle(leftEyePos, 1, "black");
        drawCircle(rightEyePos, 1, "black");
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvasSize.x, canvasSize.y);
    }

    return {
        stepAndDrawSpider,
        clearCanvas,
        setPixelScale,
        transformPointToCanvas,
        getCanvasSize: () => ({
            ...canvasSize
        }),
    };
}