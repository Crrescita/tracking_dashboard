declare module "@mapbox/point-geometry" {
  export default class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    add(point: Point): Point;
    sub(point: Point): Point;
    multByPoint(point: Point): Point;
    divByPoint(point: Point): Point;
    mult(k: number): Point;
    div(k: number): Point;
    rotate(angle: number): Point;
    rotateAround(angle: number, point: Point): Point;
    matMult(matrix: number[]): Point;
    unit(): Point;
    perp(): Point;
    round(): Point;
    mag(): number;
    equals(point: Point): boolean;
    dist(point: Point): number;
    distSqr(point: Point): number;
    angle(): number;
    angleTo(point: Point): number;
    angleWith(point: Point): number;
    angleWithSep(x: number, y: number): number;
  }
}
