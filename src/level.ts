import { overlaps, type Rect } from "./types";

export type PlatformKind = "moss" | "stone" | "log" | "moving";

export type Platform = Rect & {
  kind: PlatformKind;
  vx: number;
  minX?: number;
  maxX?: number;
  speed?: number;
  dir?: number;
};

export type Thorn = Rect;
export type Firefly = Rect & { collected: boolean; phase: number };
export type Beetle = Rect & { minX: number; maxX: number; dir: number; speed: number; phase: number };
export type Checkpoint = Rect & { activated: boolean };
export type Goal = Rect;

export type Level = {
  width: number;
  spawn: { x: number; y: number };
  platforms: Platform[];
  thorns: Thorn[];
  fireflies: Firefly[];
  beetles: Beetle[];
  checkpoint: Checkpoint;
  goal: Goal;
};

function solid(x: number, y: number, w: number, h: number, kind: PlatformKind = "moss"): Platform {
  return { x, y, w, h, kind, vx: 0 };
}

function mover(x: number, y: number, w: number, h: number, minX: number, maxX: number, speed: number): Platform {
  return { x, y, w, h, kind: "moving", vx: speed, minX, maxX, speed, dir: 1 };
}

export function createLevel(): Level {
  const platforms: Platform[] = [
    solid(0, 560, 520, 180, "moss"),
    solid(280, 470, 150, 28, "stone"),
    solid(660, 560, 300, 180, "moss"),
    solid(980, 488, 240, 36, "log"),
    solid(1240, 560, 420, 180, "moss"),
    solid(1520, 430, 120, 24, "stone"),
    solid(1780, 500, 90, 22, "stone"),
    mover(1980, 430, 130, 22, 1920, 2280, 70),
    solid(2480, 520, 160, 24, "stone"),
    solid(2720, 560, 980, 180, "moss"),
    solid(2780, 430, 70, 18, "stone"),
    solid(2920, 390, 70, 18, "stone"),
    solid(3060, 450, 80, 18, "stone"),
    solid(3220, 400, 90, 22, "stone"),
    solid(3480, 480, 140, 28, "log"),
  ];

  const fireflies: Firefly[] = [
    { x: 220, y: 400, w: 16, h: 16, collected: false, phase: 0.2 },
    { x: 300, y: 360, w: 16, h: 16, collected: false, phase: 1.1 },
    { x: 380, y: 400, w: 16, h: 16, collected: false, phase: 2.0 },
    { x: 740, y: 470, w: 16, h: 16, collected: false, phase: 0.6 },
    { x: 1080, y: 410, w: 16, h: 16, collected: false, phase: 1.4 },
    { x: 1560, y: 360, w: 16, h: 16, collected: false, phase: 0.9 },
    { x: 2140, y: 340, w: 16, h: 16, collected: false, phase: 2.4 },
    { x: 2520, y: 440, w: 16, h: 16, collected: false, phase: 0.3 },
    { x: 2940, y: 320, w: 16, h: 16, collected: false, phase: 1.7 },
    { x: 3520, y: 400, w: 16, h: 16, collected: false, phase: 2.8 },
  ];

  const thorns: Thorn[] = [
    { x: 2860, y: 536, w: 48, h: 24 },
    { x: 3000, y: 536, w: 70, h: 24 },
    { x: 3140, y: 536, w: 48, h: 24 },
    { x: 3360, y: 536, w: 90, h: 24 },
  ];

  const beetles: Beetle[] = [
    { x: 1020, y: 456, w: 36, h: 32, minX: 990, maxX: 1180, dir: 1, speed: 55, phase: 0 },
    { x: 3500, y: 448, w: 36, h: 32, minX: 3490, maxX: 3600, dir: -1, speed: 40, phase: 1 },
  ];

  return {
    width: 4000,
    spawn: { x: 72, y: 500 },
    platforms,
    thorns,
    fireflies,
    beetles,
    checkpoint: { x: 1440, y: 500, w: 56, h: 60, activated: false },
    goal: { x: 3720, y: 250, w: 90, h: 310 },
  };
}

export function updateLevel(level: Level, dt: number, player: Rect) {
  for (const platform of level.platforms) {
    if (platform.kind !== "moving" || platform.minX == null || platform.maxX == null || platform.speed == null) {
      continue;
    }
    platform.dir ??= 1;
    platform.x += platform.speed * platform.dir * dt;
    platform.vx = platform.speed * platform.dir;
    if (platform.x <= platform.minX) {
      platform.x = platform.minX;
      platform.dir = 1;
    } else if (platform.x + platform.w >= platform.maxX) {
      platform.x = platform.maxX - platform.w;
      platform.dir = -1;
    }
  }

  for (const beetle of level.beetles) {
    beetle.x += beetle.speed * beetle.dir * dt;
    beetle.phase += dt * 8;
    if (beetle.x <= beetle.minX) {
      beetle.x = beetle.minX;
      beetle.dir = 1;
    } else if (beetle.x + beetle.w >= beetle.maxX) {
      beetle.x = beetle.maxX - beetle.w;
      beetle.dir = -1;
    }
  }

  for (const firefly of level.fireflies) {
    firefly.phase += dt;
    if (!firefly.collected && overlaps(player, firefly)) firefly.collected = true;
  }

  if (!level.checkpoint.activated && overlaps(player, level.checkpoint)) {
    level.checkpoint.activated = true;
  }
}

export function resetCollectibles(level: Level) {
  for (const firefly of level.fireflies) firefly.collected = false;
  level.checkpoint.activated = false;
}

export function fireflyScore(level: Level): { got: number; total: number } {
  const got = level.fireflies.filter((f) => f.collected).length;
  return { got, total: level.fireflies.length };
}
