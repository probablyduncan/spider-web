import { getPointAt, lessExtreme, toRads } from "./math";
import type { HeartState, Point, SpiderState } from "./types";

export function createWebCanvas(canvas: HTMLCanvasElement) {
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

    function getTarget(targets: Point[]): {
        /** center of targets */
        target: Point;
        /** between 0 and 1 */
        spread: number
    } {

        const result = {
            target: {
                x: 0,
                y: 0,
            },
            spread: 0,
        };

        if (!targets.length) {
            return result;
        }

        const min = { x: Infinity, y: Infinity };
        const max = { x: 0, y: 0 };

        targets.forEach(({ x, y }) => {

            min.x = Math.min(min.x, x);
            max.x = Math.max(max.x, x);
            min.y = Math.min(min.y, y);
            max.y = Math.max(max.y, y);

            result.target.x += x;
            result.target.y += y;
        });

        if (targets.length > 1) {
            result.spread = Math.max(Math.min(((max.x - min.x) + (max.y - min.y)) / 2 - 100, 100), 0) / 100;
        }


        result.target.x /= targets.length;
        result.target.y /= targets.length;

        return result;
    }

    function transformPointToCanvas(point: Point, currentScale: Point = { x: 1, y: 1 }) {
        return {
            x: canvasSize.x * point.x / currentScale.x,
            y: canvasSize.y * point.y / currentScale.y,
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

    function drawEllipse(center: Point, radius: Point, angle: number, fillColor?: string, stroke?: {
        color: string,
        width: number,
    }) {
        context.beginPath();
        context.ellipse(center.x, center.y, radius.x, radius.y, angle, 0, 2 * Math.PI);

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

    function stepAndDrawSpider(deltaMS: number, timestamp: number, spider: SpiderState) {

        if (!spider.targets.length) {
            spider.targets.push({
                x: 0,
                y: 0,
            });
        }

        const { target, spread } = getTarget(spider.targets);
        spider.current ??= target;
        const center = spider.current;

        const scale = spider.scale * (1 + spread);

        // face target
        spider.angle = Math.atan2(target.y - center.y, target.x - center.x);

        // push target back a bit, away from cursor
        if (spider.targetPadding) {
            target.x -= spider.targetPadding * Math.cos(spider.angle);
            target.y -= spider.targetPadding * Math.sin(spider.angle);
        }

        const distanceToTarget = {
            x: target.x - center.x,
            y: target.y - center.y,
        }

        let velocity: number;

        // update current position
        switch (spider.interpolation.type) {
            case "linear":
                {
                    // can I make this a little more natural?
                    velocity = spider.interpolation.speed;
                    const distanceToTravel = {
                        x: Math.cos(spider.angle) * spider.interpolation.speed,
                        y: Math.sin(spider.angle) * spider.interpolation.speed,
                    };
                    center.x += lessExtreme(distanceToTarget.x, distanceToTravel.x);
                    center.y += lessExtreme(distanceToTarget.y, distanceToTravel.y);
                    break;
                }
            case "ease":
                {
                    const lerp = Math.min(1, 0.5 * deltaMS / spider.interpolation.halfLife);
                    const distanceToTravel = {
                        x: distanceToTarget.x * lerp,
                        y: distanceToTarget.y * lerp,
                    };
                    velocity = Math.sqrt(Math.pow(distanceToTravel.x, 2) + Math.pow(distanceToTravel.y, 2));
                    center.x += distanceToTravel.x;
                    center.y += distanceToTravel.y;
                    break;
                }
        }

        const isAtRest = velocity < 0.1;

        // walk legs
        for (let i = 0; i < idealFeet.length * 2; i++) {

            const baseLegLength = 30 * scale + (spread * 100);

            const footConfig = idealFeet[Math.floor(i / 2)];
            const side = (i % 2 === 0) ? 1 : -1;

            const idealFoot = getPointAt(spider.current, footConfig.length * baseLegLength, spider.angle + footConfig.angle * side);

            // if no foot, or we're at rest, set to ideal
            if (spider.feet.length <= i || !spider.feet[i] || isAtRest && Math.random() > 0.99) {
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

        // this is so that all spiders aren't synced
        const standingWiggle = Math.sin(timestamp / 100) / 20;
        const walkingWiggle = Math.min(velocity, 3) * Math.sin(timestamp / 50 + Math.random() * 0.1) / 20;
        const kissingWiggle = spider.kissing ? Math.sin(timestamp / 60) / 15 : 0;

        // ------------------- DRAW --------------------

        spider.feet.forEach(f => {
            drawLine(center, f, "black", scale * 1);
        })

        // body
        drawCircle(center, scale * 3, "black");

        // head
        spider.headPosition = getPointAt(center, scale * 5, spider.angle + walkingWiggle);
        drawCircle(spider.headPosition, scale * 3, "black");

        // abdomen
        const abdomenPos = getPointAt(center, scale * -6, spider.angle + kissingWiggle - walkingWiggle - standingWiggle);
        drawCircle(abdomenPos, scale * 6, "black");
        context.fill();

        // eyes
        const eyeAngle = 0.42;  // 25 deg ish
        const leftEyePos = getPointAt(center, scale * 5, spider.angle - eyeAngle + walkingWiggle);
        const rightEyePos = getPointAt(center, scale * 5, spider.angle + eyeAngle + walkingWiggle);

        const eyeSize = scale * 2;
        // black outlines
        drawCircle(leftEyePos, eyeSize + 0.5, "black");
        drawCircle(rightEyePos, eyeSize + 0.5, "black");

        // whites of the eyes
        const blinkCycleLength = 2500;
        const blinkLength = 250;
        const blink = 1 - ((isAtRest && ((timestamp % blinkCycleLength) < blinkLength)) 
            ? Math.sin(Math.PI * (timestamp % blinkCycleLength) / blinkLength) 
            : 0);
        drawEllipse(leftEyePos, { x: eyeSize * blink, y: eyeSize }, spider.angle, "white", { color: "black", width: 1 });
        drawEllipse(rightEyePos, { x: eyeSize * blink, y: eyeSize }, spider.angle, "white", { color: "black", width: 1 });

        // pupils
        drawCircle(leftEyePos, eyeSize / 2, "black");
        drawCircle(rightEyePos, eyeSize / 2, "black");
    }

    function stepAndDrawHeart(delta: number, heart: HeartState) {

        if (heart.delay > 0) {
            heart.delay -= delta;
            return;
        }

        heart.progress += delta;
        if (heart.progress > heart.duration) {
            heart.progress = heart.duration;
        }

        // 1 if complete, 0 if just started
        const progress = heart.progress / heart.duration;

        // start at center, end towards rotation
        const position = {
            x: heart.center.x + Math.cos(heart.angle) * progress * 20,
            y: heart.center.y + Math.sin(heart.angle) * progress * 20,
        }

        // start at 1, end at 0
        const opacity = 1 - progress;

        // start at size, end at 1.5*size
        const fontSize = heart.size + heart.size * progress * 0.5;

        context.save();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.textRendering = "optimizeSpeed";
        context.font = fontSize + "px serif";
        context.globalAlpha = opacity;
        context.fillText(heart.char, position.x, position.y);

        context.restore();
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvasSize.x, canvasSize.y);
    }

    return {
        stepAndDrawSpider,
        stepAndDrawHeart,
        clearCanvas,
        setPixelScale,
        transformPointToCanvas,
        getCanvasSize: () => ({
            ...canvasSize
        }),
        getCanvasAspectRatio: () => canvasSize.x / canvasSize.y,
        getCanvasOrientation: () => canvasSize.x > canvasSize.y ? "landscape" : "portrait",
    };
}