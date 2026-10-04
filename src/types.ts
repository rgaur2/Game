export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const DEATH_Y = 820;
