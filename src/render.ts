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
  drawPlayer(ctx, camera, player, time);
  drawParticles(ctx, camera, particles, 1);
  drawForegroundMoss(ctx, camera, level.width);
  drawVignette(ctx);
}

function world(ctx: CanvasRenderingContext2D, camera: Camera, x: number, y: number) {
  ctx.translate(x - camera.x, y - camera.y);
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, "#161428");
  sky.addColorStop(0.34, "#322848");
  sky.addColorStop(0.58, "#7a4d68");
  sky.addColorStop(0.78, "#e3a06c");
  sky.addColorStop(1, "#d48868");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const sun = ctx.createRadialGradient(860, 168, 6, 860, 168, 210);
  sun.addColorStop(0, "rgba(255, 244, 224, 0.95)");
  sun.addColorStop(0.16, "rgba(255, 206, 156, 0.62)");
  sun.addColorStop(0.42, "rgba(255, 156, 112, 0.16)");
  sun.addColorStop(1, "rgba(255, 140, 96, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(860, 168, 210, 0, Math.PI * 2);
  ctx.fill();

  const haze = ctx.createLinearGradient(0, VIEW_H * 0.46, 0, VIEW_H * 0.82);
  haze.addColorStop(0, "rgba(255, 196, 160, 0)");
  haze.addColorStop(0.45, "rgba(255, 176, 140, 0.14)");
  haze.addColorStop(1, "rgba(120, 70, 70, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, VIEW_H * 0.46, VIEW_W, VIEW_H * 0.36);
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  h: number,
  sway: number,
  top: string,
  bottom: string,
) {
  const crown = VIEW_H - h;
  const gradient = ctx.createLinearGradient(x, crown, x, VIEW_H);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x, VIEW_H);
  ctx.quadraticCurveTo(x + 16, VIEW_H - h * 0.42, x + 28 + sway, crown + 18);
  ctx.quadraticCurveTo(x + 40 + sway, crown - 8, x + 58, VIEW_H);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 30 + sway * 0.4, crown + 28, 30, 40, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarTrees(ctx: CanvasRenderingContext2D, camera: Camera, width: number, time: number) {
  const back = camera.x * 0.22;
  for (let i = 0; i < width / 70; i++) {
    const x = i * 90 - (back % 90) - 90;
    const h = 190 + hash(i) * 150;
    drawTreeSilhouette(ctx, x, h, 0, "#22283a", "#141824");
  }

  const mid = camera.x * 0.45;
  for (let i = 0; i < width / 55; i++) {
    const x = i * 78 - (mid % 78) - 80;
    const h = 230 + hash(i + 40) * 170;
    const sway = Math.sin(time * 0.4 + i) * 4;
    const top = i % 2 === 0 ? "#173528" : "#1c4030";
    drawTreeSilhouette(ctx, x, h, sway, top, "#102018");
  }
}

function drawCanopy(ctx: CanvasRenderingContext2D, camera: Camera, time: number) {
  const canopy = ctx.createLinearGradient(0, 0, 0, 92);
  canopy.addColorStop(0, "rgba(8, 24, 18, 0.72)");
  canopy.addColorStop(1, "rgba(10, 32, 22, 0)");
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= VIEW_W; x += 12) {
    const y = 46 + Math.sin(x * 0.018 + camera.x * 0.004 + time * 0.3) * 16;
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
    const glow = 0.28 + Math.sin(p.phase) * 0.18;
    const dust = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4.5);
    dust.addColorStop(0, `rgba(255, 228, 170, ${glow})`);
    dust.addColorStop(1, "rgba(255, 196, 110, 0)");
    ctx.fillStyle = dust;
    ctx.beginPath();
    ctx.arc(px, py, p.size * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, camera: Camera, platform: Platform) {
  ctx.save();
  world(ctx, camera, platform.x, platform.y);
  const colors = {
    moss: { top: "#6ea86a", mid: "#3f7a48", body: "#234432", edge: "rgba(214, 228, 150, 0.7)" },
    stone: { top: "#8c9684", mid: "#5c6758", body: "#343c34", edge: "rgba(214, 220, 196, 0.55)" },
    log: { top: "#b07a48", mid: "#7a4a28", body: "#4a2c16", edge: "rgba(236, 196, 140, 0.6)" },
    moving: { top: "#7eb67a", mid: "#3f7a4c", body: "#234432", edge: "rgba(230, 240, 160, 0.75)" },
  }[platform.kind];

  if (platform.h < 48) {
    ctx.fillStyle = "rgba(18, 10, 16, 0.2)";
    ctx.beginPath();
    ctx.ellipse(platform.w / 2, platform.h + 7, platform.w * 0.38, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const body = ctx.createLinearGradient(0, 0, 0, Math.min(platform.h, 120));
  body.addColorStop(0, colors.top);
  body.addColorStop(0.28, colors.mid);
  body.addColorStop(1, colors.body);
  ctx.fillStyle = body;
  roundRect(ctx, 0, 0, platform.w, platform.h, 12);
  ctx.fill();

  ctx.fillStyle = colors.edge;
  ctx.globalAlpha = 0.85;
  roundRect(ctx, 4, 3, Math.max(platform.w - 8, 4), 7, 5);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  const marks = Math.max(2, Math.floor(platform.w / 52));
  for (let i = 0; i < marks; i++) {
    const mx = 14 + hash(i * 3 + platform.x) * Math.max(platform.w - 28, 1);
    ctx.beginPath();
    ctx.ellipse(mx, 8, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawThorn(ctx: CanvasRenderingContext2D, camera: Camera, thorn: Thorn, time: number) {
  ctx.save();
  world(ctx, camera, thorn.x, thorn.y);
  const spikes = Math.max(3, Math.round(thorn.w / 16));
  const bramble = ctx.createLinearGradient(0, 0, 0, thorn.h);
  bramble.addColorStop(0, "#c45a78");
  bramble.addColorStop(0.45, "#7a3050");
  bramble.addColorStop(1, "#3d1830");
  ctx.fillStyle = bramble;
  ctx.beginPath();
  ctx.moveTo(0, thorn.h);
  for (let i = 0; i < spikes; i++) {
    const x0 = (i / spikes) * thorn.w;
    const x1 = ((i + 0.5) / spikes) * thorn.w;
    const x2 = ((i + 1) / spikes) * thorn.w;
    const tip = 3 + Math.sin(time * 3 + i) * 1.2;
    ctx.lineTo(x0, thorn.h - 1);
    ctx.quadraticCurveTo(x1, tip, x2, thorn.h - 1);
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
  const pulse = 0.45 + Math.sin(time * 5 + firefly.phase) * 0.22;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, 18);
  halo.addColorStop(0, `rgba(255, 236, 180, ${0.85 * pulse})`);
  halo.addColorStop(0.35, `rgba(255, 196, 80, ${0.28 * pulse})`);
  halo.addColorStop(1, "rgba(255, 180, 60, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 250, 220, ${0.8 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeetle(ctx: CanvasRenderingContext2D, camera: Camera, beetle: Beetle) {
  ctx.save();
  world(ctx, camera, beetle.x + beetle.w / 2, beetle.y + beetle.h / 2);
  ctx.scale(beetle.dir, 1);
  ctx.fillStyle = "rgba(24, 12, 10, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 15, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const leg = Math.sin(beetle.phase) * 3;
  ctx.strokeStyle = "#3a2418";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, 3);
  ctx.lineTo(-14, 11 + leg);
  ctx.moveTo(-3, 5);
  ctx.lineTo(-5, 13 - leg);
  ctx.moveTo(7, 4);
  ctx.lineTo(12, 12 + leg);
  ctx.stroke();

  const shell = ctx.createLinearGradient(-16, -12, 14, 10);
  shell.addColorStop(0, "#a86438");
  shell.addColorStop(0.45, "#6a3a1e");
  shell.addColorStop(1, "#3a2014");
  ctx.fillStyle = shell;
  roundRect(ctx, -16, -11, 32, 20, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 214, 170, 0.28)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.quadraticCurveTo(-2, -2, -6, 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(28, 12, 8, 0.45)";
  ctx.beginPath();
  ctx.moveTo(-1, -9);
  ctx.quadraticCurveTo(1, 0, -1, 8);
  ctx.stroke();

  ctx.fillStyle = "#4e2c18";
  ctx.beginPath();
  ctx.ellipse(12, -1, 6.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2d48a";
  ctx.beginPath();
  ctx.arc(14, -2, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a160e";
  ctx.beginPath();
  ctx.arc(14.7, -2, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, camera: Camera, checkpoint: Checkpoint, time: number) {
  ctx.save();
  world(ctx, camera, checkpoint.x, checkpoint.y);
  const stem = ctx.createLinearGradient(22, 18, 32, 60);
  stem.addColorStop(0, "#f7f3ea");
  stem.addColorStop(1, "#d9d0c0");
  ctx.fillStyle = stem;
  roundRect(ctx, 22, 18, 10, 42, 5);
  ctx.fill();
  const cap = ctx.createRadialGradient(20, 10, 2, 27, 16, 24);
  cap.addColorStop(0, checkpoint.activated ? "#ffb2a4" : "#e07a6c");
  cap.addColorStop(1, checkpoint.activated ? "#d24a3c" : "#a83830");
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(27, 16, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = checkpoint.activated ? "#ffe08a" : "#6e2e28";
  ctx.beginPath();
  ctx.ellipse(20, 10, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (checkpoint.activated) {
    const pulse = ctx.createRadialGradient(27, 8, 4, 27, 8, 32);
    pulse.addColorStop(0, `rgba(255, 214, 120, ${0.45 + Math.sin(time * 4) * 0.12})`);
    pulse.addColorStop(1, "rgba(255, 196, 80, 0)");
    ctx.fillStyle = pulse;
    ctx.beginPath();
    ctx.arc(27, 8, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGoal(ctx: CanvasRenderingContext2D, camera: Camera, goal: Goal, time: number) {
  ctx.save();
  world(ctx, camera, goal.x, goal.y);
  const aura = ctx.createRadialGradient(goal.w / 2, 80, 10, goal.w / 2, 80, 120);
  aura.addColorStop(0, `rgba(255, 214, 130, ${0.28 + Math.sin(time) * 0.06})`);
  aura.addColorStop(1, "rgba(255, 190, 90, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(goal.w / 2, 80, 120, 0, Math.PI * 2);
  ctx.fill();

  const trunk = ctx.createLinearGradient(goal.w / 2 - 16, 150, goal.w / 2 + 16, goal.h);
  trunk.addColorStop(0, "#6a4030");
  trunk.addColorStop(1, "#3a2418");
  ctx.fillStyle = trunk;
  roundRect(ctx, goal.w / 2 - 16, 140, 32, goal.h - 140, 10);
  ctx.fill();

  const leaves = ctx.createRadialGradient(goal.w / 2 - 8, 70, 8, goal.w / 2, 88, 86);
  leaves.addColorStop(0, "#6cbc72");
  leaves.addColorStop(0.55, "#2f6b42");
  leaves.addColorStop(1, "#1c4630");
  ctx.fillStyle = leaves;
  ctx.beginPath();
  ctx.ellipse(goal.w / 2, 90, 78, 84, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(126, 196, 112, 0.85)";
  ctx.beginPath();
  ctx.ellipse(goal.w / 2 - 24, 68, 40, 34, 0, 0, Math.PI * 2);
  ctx.ellipse(goal.w / 2 + 26, 76, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const a = time * 0.8 + i;
    const lx = goal.w / 2 + Math.cos(a) * 30;
    const ly = 80 + Math.sin(a * 1.3) * 24;
    const mote = ctx.createRadialGradient(lx, ly, 0, lx, ly, 7);
    mote.addColorStop(0, "rgba(255, 240, 190, 0.95)");
    mote.addColorStop(1, "rgba(255, 210, 100, 0)");
    ctx.fillStyle = mote;
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, camera: Camera, player: Player, time: number) {
  const cx = player.x + player.w / 2 - camera.x;
  const cy = player.y + player.h / 2 - camera.y;
  const bob = player.state === "idle" ? Math.sin(time * 4) * 2.2 : 0;
  const run = player.state === "run" ? Math.sin(player.animTime * 14) : 0;
  const stretchY = player.squash * (player.state === "jump" ? 1.12 : player.state === "glide" ? 0.92 : 1);
  const stretchX = 1 / stretchY;

  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(player.facing * stretchX, stretchY);

  const aura = ctx.createRadialGradient(0, 4, 4, 0, 4, 36);
  aura.addColorStop(0, "rgba(176, 255, 210, 0.32)");
  aura.addColorStop(1, "rgba(140, 255, 190, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(0, 4, 36, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.state === "glide") {
    ctx.fillStyle = "rgba(176, 214, 112, 0.42)";
    ctx.beginPath();
    ctx.ellipse(-8, 8, 20, 6, -0.35, 0, Math.PI * 2);
    ctx.ellipse(12, 10, 17, 5, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(214, 236, 150, 0.7)";
    ctx.beginPath();
    ctx.ellipse(-6, 7, 12, 3.2, -0.35, 0, Math.PI * 2);
    ctx.ellipse(10, 9, 10, 2.6, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  const body = ctx.createRadialGradient(-3, -2, 2, 0, 4, 18);
  body.addColorStop(0, "#f7fff8");
  body.addColorStop(1, "#b6f3d2");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(150, 230, 186, 0.85)";
  ctx.beginPath();
  ctx.ellipse(0, 7, 7.5, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6fd36a";
  ctx.beginPath();
  ctx.ellipse(-8, -14 + run, 7, 11, -0.5, 0, Math.PI * 2);
  ctx.ellipse(6, -15 - run * 0.4, 6, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c6e85a";
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

  if (player.state === "run") {
    ctx.strokeStyle = "rgba(180, 255, 140, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 16);
    ctx.quadraticCurveTo(-10, 22 + run * 4, -2, 26);
    ctx.stroke();
  }

  ctx.restore();
}

function drawForegroundMoss(ctx: CanvasRenderingContext2D, camera: Camera, width: number) {
  const shift = camera.x * 1.15;
  const moss = ctx.createLinearGradient(0, VIEW_H - 48, 0, VIEW_H);
  moss.addColorStop(0, "rgba(16, 36, 24, 0)");
  moss.addColorStop(0.35, "rgba(14, 34, 24, 0.28)");
  moss.addColorStop(1, "rgba(10, 24, 18, 0.55)");
  ctx.fillStyle = moss;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  for (let x = 0; x <= VIEW_W; x += 10) {
    const y = VIEW_H - 22 - hash(Math.floor((x + shift) / 18)) * 16;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
  void width;
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.45, 220, VIEW_W / 2, VIEW_H * 0.5, 640);
  g.addColorStop(0, "rgba(18, 10, 28, 0)");
  g.addColorStop(0.72, "rgba(18, 10, 28, 0)");
  g.addColorStop(1, "rgba(14, 8, 22, 0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawHud(ctx: CanvasRenderingContext2D, got: number, total: number) {
  ctx.fillStyle = "rgba(20, 14, 32, 0.38)";
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

export function drawOverlay(ctx: CanvasRenderingContext2D, screen: Screen, got: number, total: number) {
  if (screen === "play") return;
  ctx.fillStyle = "rgba(12, 8, 16, 0.55)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8f6d8";
  ctx.font = "700 64px Georgia, serif";

  if (screen === "title") {
    ctx.fillText("Grove Sprite", VIEW_W / 2, 230);
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "#d7c4a0";
    ctx.fillText("A little forest spirit on the way home.", VIEW_W / 2, 278);
    drawControls(ctx, 330);
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = "#ffe08a";
    ctx.fillText("Press Enter or click to begin", VIEW_W / 2, 560);
  } else if (screen === "fail") {
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

function drawControls(ctx: CanvasRenderingContext2D, y: number) {
  const lines = [
    "Move: Arrow keys or A / D",
    "Jump: Space, W, or Up",
    "Leaf glide: hold jump in the air",
  ];
  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#f4efe4";
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + i * 36));
}

export function clampCamera(x: number, y: number, worldWidth: number): Camera {
  return {
    x: Math.max(0, Math.min(x, worldWidth - VIEW_W)),
    y: Math.max(0, Math.min(y, 0)),
  };
}
