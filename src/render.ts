import { CHARACTERS, type CharacterLook } from "./characters";
import type { Player } from "./player";
import type { Beetle, Checkpoint, Firefly, Goal, Level, Platform, Thorn } from "./level";
import { VIEW_H, VIEW_W } from "./types";

export type Screen = "title" | "play" | "fail" | "win";

export type Camera = { x: number; y: number };

type Particle = { x: number; y: number; phase: number; size: number; layer: number };

export function createParticles(width: number): Particle[] {
  const list: Particle[] = [];
  for (let i = 0; i < 70; i++) {
    list.push({
      x: Math.random() * width,
      y: 80 + Math.random() * 500,
      phase: Math.random() * Math.PI * 2,
      size: 1.2 + Math.random() * 2.4,
      layer: Math.random() < 0.45 ? 0 : 1,
    });
  }
  return list;
}

export function updateParticles(particles: Particle[], dt: number, width: number) {
  for (const p of particles) {
    p.phase += dt;
    p.y += Math.sin(p.phase * 1.4) * 8 * dt;
    p.x += Math.cos(p.phase * 0.6) * 6 * dt;
    if (p.x < 0) p.x += width;
    if (p.x > width) p.x -= width;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  level: Level,
  player: Player,
  particles: Particle[],
  time: number,
  showPlayer = true,
) {
  drawSky(ctx);
  drawFarTrees(ctx, camera, level.width, time);
  drawCanopy(ctx, camera, time);
  drawParticles(ctx, camera, particles, 0);
  for (const platform of level.platforms) drawPlatform(ctx, camera, platform);
  drawCheckpoint(ctx, camera, level.checkpoint, time);
  drawGoal(ctx, camera, level.goal, time);
  for (const thorn of level.thorns) drawThorn(ctx, camera, thorn, time);
  for (const firefly of level.fireflies) drawFirefly(ctx, camera, firefly, time);
  for (const beetle of level.beetles) drawBeetle(ctx, camera, beetle);
  if (showPlayer) drawPlayer(ctx, camera, player, time);
  drawParticles(ctx, camera, particles, 1);
  drawForegroundMoss(ctx, camera, level.width);
  drawVignette(ctx);
}

function world(ctx: CanvasRenderingContext2D, camera: Camera, x: number, y: number) {
  ctx.translate(x - camera.x, y - camera.y);
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, "#071824");
  sky.addColorStop(0.42, "#14506a");
  sky.addColorStop(0.74, "#3aa39a");
  sky.addColorStop(1, "#d7e7a8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(232, 246, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(980, 118, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(150, 220, 230, 0.22)";
  ctx.beginPath();
  ctx.arc(980, 118, 110, 0, Math.PI * 2);
  ctx.fill();
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function drawFarTrees(ctx: CanvasRenderingContext2D, camera: Camera, width: number, time: number) {
  const back = camera.x * 0.22;
  ctx.fillStyle = "#1a2230";
  for (let i = 0; i < width / 70; i++) {
    const x = i * 90 - (back % 90) - 90;
    const h = 180 + hash(i) * 160;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.lineTo(x + 28, VIEW_H - h);
    ctx.lineTo(x + 56, VIEW_H);
    ctx.fill();
  }

  const mid = camera.x * 0.45;
  for (let i = 0; i < width / 55; i++) {
    const x = i * 78 - (mid % 78) - 80;
    const h = 220 + hash(i + 40) * 180;
    const sway = Math.sin(time * 0.4 + i) * 3;
    ctx.fillStyle = i % 2 === 0 ? "#16301f" : "#1b3a24";
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.lineTo(x + 34 + sway, VIEW_H - h);
    ctx.lineTo(x + 70, VIEW_H);
    ctx.fill();
  }
}

function drawCanopy(ctx: CanvasRenderingContext2D, camera: Camera, time: number) {
  ctx.fillStyle = "rgba(10, 28, 18, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const y = 40 + Math.sin(x * 0.02 + camera.x * 0.004 + time * 0.3) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, 0);
  ctx.closePath();
  ctx.fill();
}

function drawParticles(ctx: CanvasRenderingContext2D, camera: Camera, particles: Particle[], layer: number) {
  for (const p of particles) {
    if (p.layer !== layer) continue;
    const px = p.x - camera.x * (layer === 0 ? 0.6 : 1);
    const py = p.y - camera.y;
    const glow = 0.35 + Math.sin(p.phase) * 0.25;
    ctx.fillStyle = `rgba(255, 220, 110, ${glow})`;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, camera: Camera, platform: Platform) {
  ctx.save();
  world(ctx, camera, platform.x, platform.y);
  const colors = {
    moss: { top: "#4f8a4a", body: "#2e5a32", edge: "#c9dc7a" },
    stone: { top: "#6d7a62", body: "#3f4a3c", edge: "#a8b392" },
    log: { top: "#8a5a32", body: "#5a351c", edge: "#d4a06a" },
    moving: { top: "#5e9a62", body: "#355a38", edge: "#e6f08a" },
  }[platform.kind];
  ctx.fillStyle = colors.body;
  roundRect(ctx, 0, 8, platform.w, Math.max(platform.h - 8, 16), 8);
  ctx.fill();
  ctx.fillStyle = colors.top;
  roundRect(ctx, 0, 0, platform.w, 16, 8);
  ctx.fill();
  ctx.fillStyle = colors.edge;
  for (let i = 8; i < platform.w; i += 18) {
    ctx.beginPath();
    ctx.ellipse(i, 6, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawThorn(ctx: CanvasRenderingContext2D, camera: Camera, thorn: Thorn, time: number) {
  ctx.save();
  world(ctx, camera, thorn.x, thorn.y);
  const spikes = Math.max(3, Math.round(thorn.w / 14));
  ctx.fillStyle = "#6b2a44";
  ctx.beginPath();
  ctx.moveTo(0, thorn.h);
  for (let i = 0; i < spikes; i++) {
    const x0 = (i / spikes) * thorn.w;
    const x1 = ((i + 0.5) / spikes) * thorn.w;
    const x2 = ((i + 1) / spikes) * thorn.w;
    const tip = 2 + Math.sin(time * 3 + i) * 1.5;
    ctx.lineTo(x0, thorn.h);
    ctx.lineTo(x1, tip);
    ctx.lineTo(x2, thorn.h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFirefly(ctx: CanvasRenderingContext2D, camera: Camera, firefly: Firefly, time: number) {
  if (firefly.collected) return;
  const bob = Math.sin(time * 3 + firefly.phase) * 6;
  const x = firefly.x + firefly.w / 2 - camera.x;
  const y = firefly.y + firefly.h / 2 - camera.y + bob;
  const pulse = 0.45 + Math.sin(time * 5 + firefly.phase) * 0.25;
  ctx.fillStyle = `rgba(255, 210, 80, ${pulse * 0.35})`;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 240, 160, ${0.7 + pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeetle(ctx: CanvasRenderingContext2D, camera: Camera, beetle: Beetle) {
  ctx.save();
  world(ctx, camera, beetle.x + beetle.w / 2, beetle.y + beetle.h / 2);
  ctx.scale(beetle.dir, 1);
  ctx.fillStyle = "#2c1a12";
  const leg = Math.sin(beetle.phase) * 4;
  ctx.fillRect(-14, 6, 4, 8 + leg);
  ctx.fillRect(6, 6, 4, 8 - leg);
  ctx.fillStyle = "#6b3a1c";
  roundRect(ctx, -16, -10, 32, 20, 8);
  ctx.fill();
  ctx.fillStyle = "#3a2214";
  ctx.fillRect(-1, -10, 2, 20);
  ctx.fillStyle = "#e8c96a";
  ctx.beginPath();
  ctx.arc(10, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, camera: Camera, checkpoint: Checkpoint, time: number) {
  ctx.save();
  world(ctx, camera, checkpoint.x, checkpoint.y);
  ctx.fillStyle = "#f2efe4";
  roundRect(ctx, 22, 18, 10, 42, 4);
  ctx.fill();
  ctx.fillStyle = checkpoint.activated ? "#e85a4a" : "#c44a3a";
  ctx.beginPath();
  ctx.ellipse(27, 16, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = checkpoint.activated ? "#ffd36a" : "#7a2a22";
  ctx.beginPath();
  ctx.ellipse(20, 10, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (checkpoint.activated) {
    ctx.fillStyle = `rgba(255, 210, 90, ${0.35 + Math.sin(time * 4) * 0.15})`;
    ctx.beginPath();
    ctx.arc(27, 8, 28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGoal(ctx: CanvasRenderingContext2D, camera: Camera, goal: Goal, time: number) {
  ctx.save();
  world(ctx, camera, goal.x, goal.y);
  ctx.fillStyle = `rgba(255, 200, 90, ${0.12 + Math.sin(time) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(goal.w / 2, 70, 90, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a2a18";
  roundRect(ctx, goal.w / 2 - 16, 150, 32, goal.h - 150, 8);
  ctx.fill();
  ctx.fillStyle = "#2f6b3a";
  ctx.beginPath();
  ctx.ellipse(goal.w / 2, 90, 78, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4f9a52";
  ctx.beginPath();
  ctx.ellipse(goal.w / 2 - 24, 70, 40, 36, 0, 0, Math.PI * 2);
  ctx.ellipse(goal.w / 2 + 26, 78, 36, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 230, 120, 0.85)";
  for (let i = 0; i < 6; i++) {
    const a = time * 0.8 + i;
    ctx.beginPath();
    ctx.arc(goal.w / 2 + Math.cos(a) * 30, 80 + Math.sin(a * 1.3) * 24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSpirit(
  ctx: CanvasRenderingContext2D,
  look: CharacterLook,
  time: number,
  state: Player["state"],
  animTime: number,
  squash: number,
  facing: 1 | -1,
) {
  const bob = state === "idle" ? Math.sin(time * 4) * 2.2 : 0;
  const run = state === "run" ? Math.sin(animTime * 14) : 0;
  const stretchY = squash * (state === "jump" ? 1.12 : state === "glide" ? 0.92 : 1);
  const stretchX = 1 / stretchY;

  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(facing * stretchX, stretchY);

  ctx.fillStyle = look.aura;
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state === "glide") {
    ctx.fillStyle = look.wing;
    ctx.beginPath();
    ctx.ellipse(-6, 8, 18, 6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(10, 10, 16, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.belly;
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = look.leaf;
  ctx.beginPath();
  ctx.ellipse(-8, -14 + run, 7, 11, -0.5, 0, Math.PI * 2);
  ctx.ellipse(6, -15 - run * 0.4, 6, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.crown;
  ctx.beginPath();
  ctx.ellipse(-2, -18, 5, 8, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a2430";
  ctx.beginPath();
  ctx.ellipse(4, -1, 2.4, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(9, -1, 2.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(4.6, -1.8, 0.8, 0, Math.PI * 2);
  ctx.arc(9.5, -1.8, 0.7, 0, Math.PI * 2);
  ctx.fill();

  if (state === "run") {
    ctx.strokeStyle = look.leaf;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 16);
    ctx.quadraticCurveTo(-10, 22 + run * 4, -2, 26);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, camera: Camera, player: Player, time: number) {
  const cx = player.x + player.w / 2 - camera.x;
  const cy = player.y + player.h / 2 - camera.y;
  ctx.save();
  ctx.translate(cx, cy);
  drawSpirit(ctx, player.look, time, player.state, player.animTime, player.squash, player.facing);
  ctx.restore();
}

function drawForegroundMoss(ctx: CanvasRenderingContext2D, camera: Camera, width: number) {
  const shift = camera.x * 1.15;
  ctx.fillStyle = "rgba(18, 40, 24, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W; x += 24) {
    const y = VIEW_H - 28 - hash(Math.floor((x + shift) / 24)) * 22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
  void width;
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 180, VIEW_W / 2, VIEW_H / 2, 520);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(4, 16, 24, 0.4)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawHud(ctx: CanvasRenderingContext2D, got: number, total: number) {
  ctx.fillStyle = "rgba(16, 12, 20, 0.45)";
  roundRect(ctx, 24, 20, 210, 44, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 220, 110, 0.95)";
  ctx.beginPath();
  ctx.arc(48, 42, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "600 18px Georgia, serif";
  ctx.fillStyle = "#f4efe4";
  ctx.fillText(`Fireflies  ${got} / ${total}`, 66, 48);
}

const CARD_W = 210;
const CARD_H = 248;
const CARD_GAP = 36;
const CARD_Y = 188;

function cardRects() {
  const total = CHARACTERS.length * CARD_W + (CHARACTERS.length - 1) * CARD_GAP;
  const start = (VIEW_W - total) / 2;
  return CHARACTERS.map((_, index) => ({
    x: start + index * (CARD_W + CARD_GAP),
    y: CARD_Y,
    w: CARD_W,
    h: CARD_H,
    index,
  }));
}

const BEGIN_BUTTON = { x: VIEW_W / 2 - 150, y: 508, w: 300, h: 58 };

export type MenuHit = { type: "character"; index: number } | { type: "begin" };

export function hitMainMenu(x: number, y: number): MenuHit | null {
  for (const card of cardRects()) {
    if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
      return { type: "character", index: card.index };
    }
  }
  const button = BEGIN_BUTTON;
  if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
    return { type: "begin" };
  }
  return null;
}

function drawMainMenu(ctx: CanvasRenderingContext2D, selected: number, time: number) {
  ctx.fillStyle = "rgba(6, 24, 34, 0.42)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "rgba(8, 28, 38, 0.72)";
  roundRect(ctx, 150, 36, VIEW_W - 300, 650, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(214, 236, 196, 0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, 150, 36, VIEW_W - 300, 650, 28);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#f3ffe8";
  ctx.font = "700 58px Georgia, serif";
  ctx.fillText("Grove Sprite", VIEW_W / 2, 108);
  ctx.font = "22px Georgia, serif";
  ctx.fillStyle = "#d5ecdc";
  ctx.fillText("Choose a forest spirit, then head home.", VIEW_W / 2, 148);

  for (const card of cardRects()) {
    const look = CHARACTERS[card.index];
    const active = card.index === selected;
    ctx.fillStyle = active ? "rgba(232, 255, 236, 0.16)" : "rgba(255, 255, 255, 0.06)";
    roundRect(ctx, card.x, card.y, card.w, card.h, 18);
    ctx.fill();
    ctx.strokeStyle = active ? "#ffe08a" : "rgba(214, 236, 196, 0.28)";
    ctx.lineWidth = active ? 3 : 1.5;
    roundRect(ctx, card.x, card.y, card.w, card.h, 18);
    ctx.stroke();

    ctx.save();
    ctx.translate(card.x + card.w / 2, card.y + 108);
    ctx.scale(1.7, 1.7);
    drawSpirit(ctx, look, time, "idle", 0, 1, 1);
    ctx.restore();

    ctx.fillStyle = "#f4efe4";
    ctx.font = "700 26px Georgia, serif";
    ctx.fillText(look.name, card.x + card.w / 2, card.y + 188);
    ctx.font = "18px Georgia, serif";
    ctx.fillStyle = "#d7c4a0";
    ctx.fillText(look.blurb, card.x + card.w / 2, card.y + 216);
  }

  const button = BEGIN_BUTTON;
  ctx.fillStyle = "#e7f6c8";
  roundRect(ctx, button.x, button.y, button.w, button.h, 16);
  ctx.fill();
  ctx.fillStyle = "#163226";
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("Begin", button.x + button.w / 2, button.y + 37);

  ctx.font = "18px Georgia, serif";
  ctx.fillStyle = "#f4efe4";
  ctx.fillText("A / D or arrows to choose  ·  Enter or Begin to play", VIEW_W / 2, 604);
  ctx.fillStyle = "#d5ecdc";
  ctx.font = "17px Georgia, serif";
  ctx.fillText("In the grove: move with A / D, jump with Space, hold jump to glide", VIEW_W / 2, 640);
  ctx.textAlign = "left";
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  screen: Screen,
  got: number,
  total: number,
  selected: number,
  time: number,
) {
  if (screen === "play") return;
  if (screen === "title") {
    drawMainMenu(ctx, selected, time);
    return;
  }

  ctx.fillStyle = "rgba(6, 24, 34, 0.55)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8f6d8";
  ctx.font = "700 64px Georgia, serif";

  if (screen === "fail") {
    ctx.fillText("Lost in the thicket", VIEW_W / 2, 280);
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "#d7c4a0";
    ctx.fillText("You’ll wake at the last safe grove.", VIEW_W / 2, 330);
    ctx.fillStyle = "#ffe08a";
    ctx.fillText("Press Enter or click to continue", VIEW_W / 2, 420);
  } else {
    ctx.fillText("The ancient tree", VIEW_W / 2, 250);
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "#d7c4a0";
    ctx.fillText(`You gathered ${got} of ${total} fireflies.`, VIEW_W / 2, 310);
    ctx.fillStyle = "#ffe08a";
    ctx.fillText("Press Enter or click to play again", VIEW_W / 2, 420);
  }
  ctx.textAlign = "left";
}

export function clampCamera(x: number, y: number, worldWidth: number): Camera {
  return {
    x: Math.max(0, Math.min(x, worldWidth - VIEW_W)),
    y: Math.max(0, Math.min(y, 0)),
  };
}
