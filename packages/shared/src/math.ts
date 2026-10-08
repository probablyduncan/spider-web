import { type Point } from "./types";

export function moreExtreme(x1: number, x2: number) {
    return Math.abs(x1) > Math.abs(x2) ? x1 : x2;
}

export function lessExtreme(x1: number, x2: number) {
    return Math.abs(x1) > Math.abs(x2) ? x2 : x1;
}

export function isAlmostZero(point: Point, threshold: number) {
    return Math.abs(point.x) < threshold && Math.abs(point.y) < threshold;
}

export function toRads(degrees: number) {
    return degrees * Math.PI / 180;
}

export function getPointAt(start: Point, length: number, angle: number): Point {
    return {
        x: start.x + Math.cos(angle) * length,
        y: start.y + Math.sin(angle) * length,
    }
}

// returns 0 if equal, 1 if opposite

/**
 * returns 0 if angles are equal, 1 if opposite, 0.5 if at either right angle
 */
export function angleDifference(angle1: number, angle2: number) {
    let diff = Math.abs(angle1 - angle2) % (2 * Math.PI);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    return diff / Math.PI;
}

/**
 * returns the midpoint between two angles
 */
export function midpoint(angle1: number, angle2: number) {
    const x = Math.cos(angle1) + Math.cos(angle2);
    const y = Math.sin(angle1) + Math.sin(angle2);
    return Math.atan2(-y, -x);
}

export function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function getPointAroundBox(boxSize: Point, offset: number) {
    const axis = Math.floor(Math.random() + 0.5);
    const points = [
        {
            x: [-offset, offset + boxSize.x],
            y: [-offset, offset + boxSize.y],
        },
        {
            x: [boxSize.x * Math.random(), boxSize.x * Math.random()],
            y: [boxSize.y * Math.random(), boxSize.y * Math.random()],
        }
    ];

    return {
        x: points[axis].x[Math.floor(Math.random() + 0.5)],
        y: points[1 - axis].y[Math.floor(Math.random() + 0.5)],
    }
}

export function getPointsAcrossBox(boxSize: Point, offset: number): [Point, Point] {

    const axis = Math.floor(Math.random() + 0.5);
    const otherIndex = Math.floor(Math.random() + 0.5);
    const points = [
        {
            x: [-offset, offset + boxSize.x],
            y: [-offset, offset + boxSize.y],
        },
        {
            x: [boxSize.x * Math.random(), boxSize.x * Math.random()],
            y: [boxSize.y * Math.random(), boxSize.y * Math.random()],
        }
    ];

    return [
        {
            x: points[axis].x[otherIndex],
            y: points[1 - axis].y[1 - otherIndex],
        },
        {
            x: points[axis].x[1 - otherIndex],
            y: points[1 - axis].y[otherIndex],
        },
    ];
}

export const numberToEnglish = (() => {

    var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    var teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    function convert_millions(num: number): string {
        if (num >= 1000000) {
            return convert_millions(Math.floor(num / 1000000)) + " million " + convert_thousands(num % 1000000);
        } else {
            return convert_thousands(num);
        }
    }

    function convert_thousands(num: number): string {
        if (num >= 1000) {
            return convert_hundreds(Math.floor(num / 1000)) + " thousand " + convert_hundreds(num % 1000);
        } else {
            return convert_hundreds(num);
        }
    }

    function convert_hundreds(num: number): string {
        if (num > 99) {
            return ones[Math.floor(num / 100)] + " hundred " + convert_tens(num % 100);
        } else {
            return convert_tens(num);
        }
    }

    function convert_tens(num: number): string {
        if (num < 10) return ones[num];
        else if (num >= 10 && num < 20) return teens[num - 10];
        else {
            return tens[Math.floor(num / 10)] + " " + ones[num % 10];
        }
    }

    return (num: number) => {
        if (num == 0) return "zero";
        else return convert_millions(num);
    };
})();