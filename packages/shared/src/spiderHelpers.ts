type Point = {
    x: number;
    y: number;
}

type PointTransform = {
    angle: number;
    length: number;
};

export class SpiderController {
    readonly target: Point = { x: 0, y: 0 };
    readonly current: Point = { x: 0, y: 0 };
    angle: number = 0;

    private readonly _legs: PointTransform[];
    readonly feet: Point[] = [];

    private readonly _color: string;

    constructor() {

        // improve this?
        this._legs = [[45, 12], [60, 15], [90, 15], [120, 15]].flatMap(l => {
            const angle = toRads(l[0]);
            const length = l[1];
            return [{ angle, length }, { angle: -angle, length }];
        });

        this._color = "black";
    }

    step(deltaMS: DOMHighResTimeStamp) {

        // distance between current and target
        const distance = {
            x: this.target.x - this.current.x,
            y: this.target.y - this.current.y,
        }

        const isAtRest = Math.abs(distance.x) < 0.5 && Math.abs(distance.y) < 0.5;

        // face target
        this.angle = Math.atan2(-distance.y, distance.x);

        // lerp towards target
        const lerp = Math.min(1, deltaMS * 0.0030625);
        this.current.x = lerp * distance.x + this.current.x;
        this.current.y = lerp * distance.y + this.current.y;

        // walk legs
        for (let i = 0; i < this._legs.length; i++) {

            const ideal = this._legs[i];
            // this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);

            // if no foot, set to ideal
            if (this.feet.length <= i || !this.feet[i] || (isAtRest && Math.random() > 0.95)) {
                this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);
                continue;
            }

            const currentLegVector: Point = {
                x: this.feet[i].x - this.current.x,
                y: this.feet[i].y - this.current.y,
            };

            // get length, but avoid sqrt unless we're stepping, I guess
            const legLengthSquared = Math.pow(currentLegVector.x, 2) + Math.pow(currentLegVector.y, 2);

            // if leg is double ideal length, need to step
            if (legLengthSquared > Math.pow(ideal.length * 1.5, 2)) {
                this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        drawSpider(context, this.current, this.angle, this.feet, this._color);
    }

    isAtRest() {
        return Math.abs(this.current.x - this.target.x) < 0.5 && Math.abs(this.current.y - this.target.y) < 0.5;
    }
}

function drawSpider(context: CanvasRenderingContext2D, pos: Point, angle: number, feet: Point[], color: string = "black") {

    // legs
    for (let foot of feet) {
        const legAngle = Math.atan2(pos.y - foot.y, foot.x - pos.x);
        const hip = getPointAt(pos, 3, legAngle)
        drawLine(context, hip, foot, color);
    }

    // body
    drawCircle(context, pos, 3, color);

    // head
    const headPos = getPointAt(pos, 5, angle);
    drawCircle(context, headPos, 3, color);

    // thorax
    const thoraxPos = getPointAt(pos, -6, angle);
    drawCircle(context, thoraxPos, 6, color);
    context.fill();

    // eyes
    const eyeAngle = toRads(25);
    const leftEyePos = getPointAt(pos, 5, angle - eyeAngle);
    const rightEyePos = getPointAt(pos, 5, angle + eyeAngle);

    // whites, with black outlines
    drawCircle(context, leftEyePos, 2, "white", color);
    drawCircle(context, rightEyePos, 2, "white", color);

    // pupils
    drawCircle(context, leftEyePos, 1, color);
    drawCircle(context, rightEyePos, 1, color);
}

function drawCircle(context: CanvasRenderingContext2D, center: Point, radius: number, fillColor?: string, strokeColor?: string) {

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

function drawLine(context: CanvasRenderingContext2D, from: Point, to: Point | PointTransform, color: string) {

    if ("length" in to) {
        to = getPointAt(from, to.length, to.angle);
    }

    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.closePath();
}

function getPointAt(start: Point, length: number, angle: number): Point {
    return {
        x: start.x + Math.cos(angle) * length,
        y: start.y - Math.sin(angle) * length,
    }
}

function toRads(degrees: number) {
    return degrees * Math.PI / 180;
}