import { Input } from "./input";
import { Player } from "./player";
import { createLevel, fireflyScore, updateLevel, type Level } from "./level";
import {
  clampCamera,
  createParticles,
  drawHud,
  drawOverlay,
  drawWorld,
  updateParticles,
  type Camera,
  type Screen,
} from "./render";
import { DEATH_Y, VIEW_H, VIEW_W, overlaps } from "./types";

export class Game {
  private input = new Input();
  private level: Level;
  private player: Player;
  private particles;
  private screen: Screen = "title";
  private camera: Camera = { x: 0, y: 0 };
  private time = 0;
  private spawn = { x: 72, y: 500 };
  private lastSafe = { x: 72, y: 500 };

  constructor() {
    this.level = createLevel();
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    this.particles = createParticles(this.level.width);
    this.spawn = { ...this.level.spawn };
    this.lastSafe = { ...this.level.spawn };
  }

  onClick() {
    this.input.clickConfirm = true;
  }

  update(dt: number) {
    const capped = Math.min(dt, 1 / 30);
    this.time += capped;

    if (this.screen !== "play") {
      if (this.input.consumeConfirm()) {
        if (this.screen === "title" || this.screen === "win") this.startRun(this.screen === "win");
        else this.respawn();
      }
      this.input.consumeJumpPress();
      updateParticles(this.particles, capped, this.level.width);
      this.followCamera(capped);
      return;
    }

    this.player.update(capped, this.input, this.level.platforms);
    updateLevel(this.level, capped, this.player.rect);
    updateParticles(this.particles, capped, this.level.width);

    if (this.level.checkpoint.activated) {
      this.spawn = { x: this.level.checkpoint.x + 12, y: this.level.checkpoint.y - 8 };
    }

    const dead = this.player.y > DEATH_Y || this.hitsHazard();
    if (this.player.grounded && this.player.ride?.kind !== "moving" && !dead) {
      this.lastSafe = { x: this.player.x, y: this.player.y };
    }
    if (dead) {
      this.screen = "fail";
      return;
    }

    if (overlaps(this.player.rect, this.level.goal)) {
      this.screen = "win";
      return;
    }

    this.followCamera(capped);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawWorld(ctx, this.camera, this.level, this.player, this.particles, this.time);
    const score = fireflyScore(this.level);
    if (this.screen === "play") drawHud(ctx, score.got, score.total);
    drawOverlay(ctx, this.screen, score.got, score.total);
  }

  private startRun(resetAll: boolean) {
    if (resetAll) {
      this.level = createLevel();
      this.particles = createParticles(this.level.width);
      this.spawn = { ...this.level.spawn };
      this.lastSafe = { ...this.level.spawn };
    }
    this.player.place(this.level.spawn.x, this.level.spawn.y);
    this.screen = "play";
    this.followCamera(1);
  }

  private respawn() {
    const point = this.level.checkpoint.activated ? this.spawn : this.lastSafe;
    this.player.place(point.x, point.y);
    this.separateFromHazards();
    this.screen = "play";
  }

  private separateFromHazards() {
    const hazards = [...this.level.beetles, ...this.level.thorns];
    for (let pass = 0; pass < hazards.length; pass++) {
      let moved = false;
      for (const hazard of hazards) {
        if (!overlaps(this.player.rect, hazard)) continue;
        const outRight = hazard.x + hazard.w - this.player.x;
        const outLeft = this.player.x + this.player.w - hazard.x;
        if (outRight < outLeft) this.player.x = hazard.x + hazard.w;
        else this.player.x = hazard.x - this.player.w;
        moved = true;
      }
      if (!moved) break;
    }
  }

  private hitsHazard(): boolean {
    const body = this.player.rect;
    return this.level.thorns.some((t) => overlaps(body, t)) || this.level.beetles.some((b) => overlaps(body, b));
  }

  private followCamera(dt: number) {
    const look = this.player.facing * 36;
    const targetX = this.player.x + this.player.w / 2 - VIEW_W / 2 + look;
    const targetY = this.player.y + this.player.h / 2 - VIEW_H / 2;
    const next = clampCamera(
      this.camera.x + (targetX - this.camera.x) * Math.min(1, dt * 4.5),
      targetY,
      this.level.width,
    );
    this.camera = next;
  }
}
