import { Game } from "./game";
import { VIEW_H, VIEW_W } from "./types";

const canvasEl = document.querySelector<HTMLCanvasElement>("#game");
if (!canvasEl) throw new Error("Missing #game canvas");
const canvas: HTMLCanvasElement = canvasEl;

const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas 2D is unavailable");
const ctx: CanvasRenderingContext2D = context;

const game = new Game();
canvas.addEventListener("pointerdown", () => game.onClick());

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fit = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  const displayW = Math.max(1, Math.round(VIEW_W * fit));
  const displayH = Math.max(1, Math.round(VIEW_H * fit));
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  canvas.width = Math.max(1, Math.round(displayW * dpr));
  canvas.height = Math.max(1, Math.round(displayH * dpr));
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

resize();
window.addEventListener("resize", resize);

let last = performance.now();
function frame(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  game.update(dt);
  game.draw(ctx);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
