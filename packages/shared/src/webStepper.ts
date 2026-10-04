import { Point, SpiderState, RenderableSpider } from "./types";

export default function createWebStepper() {
    function stepSpider(deltaMS: number, spider: SpiderState): RenderableSpider {

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

        const legs: RenderableSpider["legs"] = spider.feet.map(foot => {
            return {
                foot,
                hip: center,
                knee: center,
            }
        });

        return {
            center,
            angle,
            legs,
        };
    }

    return (deltaMS: number, spiders: SpiderState[]): RenderableSpider[] =>
        spiders.map(spider => stepSpider(deltaMS, spider));
}


function getAverage(points: Point[]) {

    if (!points.length) {
        // points.push(getPointOffScreen());
        points.push({
            x: 0,
            y: 0,
        })
    }

    const result = {
        x: 0,
        y: 0,
    }

    points.forEach(({ x, y }) => {
        result.x += x;
        result.y += y;
    });

    result.x /= points.length;
    result.y /= points.length;

    return result;
}

function getPointOffScreen(): Point {
    const distanceOffscreen = 0.1;
    const axis = Math.floor(Math.random() + 0.5);
    const screen = [1, 1];
    const pos = [
        Math.random() * screen[axis],
        Math.random() > 0.5 ? -distanceOffscreen : (distanceOffscreen + screen[1 - axis]),
    ];
    return {
        x: pos[axis],
        y: pos[1 - axis],
    }
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