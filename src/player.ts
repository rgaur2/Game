import { CHARACTERS, type CharacterLook } from "./characters";
import type { Input } from "./input";
import type { Platform } from "./level";
import { overlaps, type Rect } from "./types";

const RUN_SPEED = 290;
const ACCEL = 2200;
const FRICTION = 1800;
const GRAVITY = 1650;
const GLIDE_GRAVITY = 280;
const MAX_FALL = 900;
const GLIDE_FALL = 95;
const JUMP_VELOCITY = -560;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.12;

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
  look: CharacterLook = CHARACTERS[0];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setLook(look: CharacterLook) {
    this.look = look;
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
    if (jumpPressed) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

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

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = JUMP_VELOCITY;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.squash = 1.18;
      this.ride = null;
    }

    this.gliding = !this.grounded && input.jump;
    if (this.gliding) {
      this.vy += GLIDE_GRAVITY * dt;
      if (this.vy > GLIDE_FALL) this.vy = GLIDE_FALL;
    } else {
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    }

    this.x += this.vx * dt;
    this.resolve(platforms, true, dt);

    this.grounded = false;
    this.ride = null;
    const prevBottom = this.y + this.h;
    this.y += this.vy * dt;
    const landed = this.resolve(platforms, false, dt, prevBottom);
    this.ride = landed;

    if (landed?.kind === "moving") {
      this.x += landed.vx * dt;
      this.resolve(platforms, true, dt);
    }

    this.squash += (1 - this.squash) * Math.min(1, dt * 10);
    this.animTime += dt;
    if (this.grounded) {
      this.state = Math.abs(this.vx) > 20 ? "run" : "idle";
    } else if (this.gliding && this.vy > -40) {
      this.state = "glide";
    } else if (this.vy < 0) {
      this.state = "jump";
    } else {
      this.state = "fall";
    }
  }

  private resolve(
    platforms: Platform[],
    horizontal: boolean,
    dt: number,
    prevBottom?: number,
  ): Platform | null {
    const body = this.rect;
    let landed: Platform | null = null;
    for (const platform of platforms) {
      if (!overlaps(body, platform)) continue;
      if (horizontal) {
        if (this.vx > 0) this.x = platform.x - this.w;
        else if (this.vx < 0) this.x = platform.x + platform.w;
        else {
          const leftOverlap = this.x + this.w - platform.x;
          const rightOverlap = platform.x + platform.w - this.x;
          this.x += rightOverlap < leftOverlap ? rightOverlap : -leftOverlap;
        }
        this.vx = 0;
        body.x = this.x;
      } else {
        const fromAbove = this.vy >= 0 && (prevBottom ?? this.y + this.h - this.vy * dt) <= platform.y + 6;
        if (fromAbove) {
          this.y = platform.y - this.h;
          this.vy = 0;
          this.grounded = true;
          this.gliding = false;
          landed = platform;
          this.squash = Math.min(this.squash, 0.9);
        } else {
          this.y = platform.y + platform.h;
          this.vy = 0;
        }
        body.y = this.y;
      }
    }
    return landed;
  }
}
