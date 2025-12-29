
import { Vector2 } from '../types';

export class RNG {
    seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    next(): number {
        var t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(min: number, max: number) {
        return min + this.next() * (max - min);
    }
}

export const dist = (v1: Vector2, v2: Vector2) => Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
export const angleTo = (from: Vector2, to: Vector2) => Math.atan2(to.y - from.y, to.x - from.x);

export const intersectLineRect = (x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number) => {
    const left = lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    const right = lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
    const top = lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    const bottom = lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
    return left || right || top || bottom;
};

const lineLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
    const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
};

export const pointInRect = (px: number, py: number, rx: number, ry: number, rw: number, rh: number) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};
