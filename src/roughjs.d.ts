declare module 'roughjs/bundled/rough.esm' {
  interface RoughOptions {
    stroke?: string
  }
  interface RoughGenerator {
    line(x1: number, y1: number, x2: number, y2: number, options?: RoughOptions): unknown
    rectangle(x: number, y: number, w: number, h: number, options?: RoughOptions): unknown
  }
  interface RoughCanvas {
    draw(drawable: unknown): void
  }
  interface RoughStatic {
    generator(): RoughGenerator
    canvas(canvas: HTMLCanvasElement): RoughCanvas
  }
  const rough: RoughStatic
  export default rough
}
