---
name: speed
description: >-
  Quick demo review that the game stays playable at the correct player speed.
  Use when the user asks for the speed skill, a speed check, or to confirm the
  player runs at the right speed.
disable-model-invocation: true
---

# Speed

Quick review for a demo. Confirm the player runs at the correct speed, then fix only that if it is wrong.

## Correct speed

- Horizontal cap is `RUN_SPEED = 155` in `src/player.ts` (pixels per second).
- Position updates multiply velocity by `dt` in seconds (`this.x += this.vx * dt`).
- `src/main.ts` converts the frame clock with `(now - last) / 1000`.
- `src/game.ts` caps the step with `Math.min(dt, 1 / 30)` before `player.update`.

Leave jump, gravity, glide, and acceleration alone unless the user asks.

## Review

1. Read `RUN_SPEED` and the horizontal update in `src/player.ts`.
2. Read the frame clock in `src/main.ts` and the cap in `src/game.ts`.
3. Pass only if all four checks above match.
4. If `RUN_SPEED` is not `155`, set it to `155` and re-read the line.
5. If the clock or the cap is wrong, report it. Do not retune other movement constants to compensate.

## Report

```
Speed check: pass | fail
Run speed: <actual> px/s (expected 155)
Frame step: seconds, capped at 1/30 | <what is wrong>
```
