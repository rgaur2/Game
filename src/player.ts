import type { Input } from "./input";
import type { Platform } from "./level";
import { overlaps, type Rect } from "./types";

const RUN_SPEED = 155;
const ACCEL = 780;
const FRICTION = 1100;
const GRAVITY = 980;
const RELEASE_GRAVITY = 2200;
const GLIDE_GRAVITY = 220;
const MAX_FALL = 720;
const GLIDE_FALL = 72;
const JUMP_VELOCITY = -530;
const COYOTE_TIME = 0.18;
const JUMP_BUFFER = 0.16;
/** Shared forgiveness for landing on a top and for ignoring a side at that lip. */
const SURFACE_SLOP = 8;

export type AnimState = "idle" | "run" | "jump" | "fall" | "glide";

export class Player {
  x: number;
  y: number;
  w = 28;
  h = 38;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1;
  grounded = false;
  gliding = false;
  coyote = 0;
  jumpBuffer = 0;
  animTime = 0;
  state: AnimState = "idle";
  squash = 1;
  ride: Platform | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  place(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.gliding = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.ride = null;
  }

  update(dt: number, input: Input, platforms: Platform[]) {
    const jumpPressed = input.consumeJumpPress();

    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (axis !== 0) {
      this.facing = axis as 1 | -1;
      this.vx += axis * ACCEL * dt;
      this.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, this.vx));
    } else {
      const mag = Math.max(0, Math.abs(this.vx) - FRICTION * dt);
      this.vx = mag * Math.sign(this.vx);
    }

    if (this.grounded) this.coyote = COYOTE_TIME;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (jumpPressed && this.coyote > 0) {
      this.jump();
    } else if (jumpPressed) {
      this.jumpBuffer = JUMP_BUFFER;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    if (this.jumpBuffer > 0 && this.coyote > 0) this.jump();

    const falling = this.vy > 20;
    this.gliding = !this.grounded && input.jump && falling;
    if (this.gliding) {
      this.vy += GLIDE_GRAVITY * dt;
      if (this.vy > GLIDE_FALL) this.vy = GLIDE_FALL;
    } else if (!this.grounded && this.vy < 0 && !input.jump) {
      this.vy += RELEASE_GRAVITY * dt;
    } else {
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    }

    const prevX = this.x;
    this.x += this.vx * dt;
    this.resolve(platforms, true, dt, undefined, prevX);

    this.grounded = false;
    this.ride = null;
    const prevBottom = this.y + this.h;
    this.y += this.vy * dt;
    const landed = this.resolve(platforms, false, dt, prevBottom);
    this.ride = landed;

    if (landed?.kind === "moving") {
      const rideFrom = this.x;
      this.x += landed.vx * dt;
      this.resolve(platforms, true, dt, undefined, rideFrom);
    }
    if (this.grounded && input.jump) this.jumpBuffer = 0;

    this.squash += (1 - this.squash) * Math.min(1, dt * 10);
    this.animTime += dt;
    if (this.grounded) {
      this.state = Math.abs(this.vx) > 20 ? "run" : "idle";
    } else if (this.gliding) {
      this.state = "glide";
    } else if (this.vy < 0) {
      this.state = "jump";
    } else {
      this.state = "fall";
    }
  }

  private jump() {
    this.vy = JUMP_VELOCITY;
    this.grounded = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.squash = 1.18;
    this.ride = null;
  }

  private resolve(
    platforms: Platform[],
    horizontal: boolean,
    dt: number,
    prevBottom?: number,
    prevX?: number,
  ): Platform | null {
    const body = this.rect;
    if (horizontal) {
      const originX = prevX ?? this.x;
      for (const platform of platforms) {
        if (!overlaps(body, platform)) continue;
        const enteredFromSide = originX + this.w <= platform.x || originX >= platform.x + platform.w;
        if (!enteredFromSide) continue;
        const feet = this.y + this.h;
        if (this.vy >= 0 && feet <= platform.y + SURFACE_SLOP) continue;
        if (originX + this.w <= platform.x) this.x = platform.x - this.w;
        else this.x = platform.x + platform.w;
        this.vx = 0;
        body.x = this.x;
      }
      return null;
    }

    const feetBefore = prevBottom ?? this.y + this.h - this.vy * dt;
    let landed: Platform | null = null;
    for (const platform of platforms) {
      if (!overlaps(body, platform)) continue;
      const fromAbove = this.vy >= 0 && feetBefore <= platform.y + SURFACE_SLOP;
      if (!fromAbove) continue;
      if (!landed || platform.y < landed.y) landed = platform;
    }
    if (!landed) return null;
    this.y = landed.y - this.h;
    this.vy = 0;
    this.grounded = true;
    this.gliding = false;
    this.squash = Math.min(this.squash, 0.9);
    return landed;
  }
}
