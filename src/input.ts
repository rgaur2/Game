export type Pointer = { x: number; y: number };

export class Input {
  left = false;
  right = false;
  jump = false;
  jumpPressed = false;
  confirmPressed = false;
  clickConfirm = false;
  menuLeftPressed = false;
  menuRightPressed = false;
  pointer: Pointer | null = null;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.releaseAll);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === " " ||
      key === "Spacebar"
    ) {
      event.preventDefault();
    }

    if (key === "ArrowLeft" || key === "a" || key === "A") {
      this.left = true;
      if (!event.repeat) this.menuLeftPressed = true;
    }
    if (key === "ArrowRight" || key === "d" || key === "D") {
      this.right = true;
      if (!event.repeat) this.menuRightPressed = true;
    }
    if (key === "ArrowUp" || key === "w" || key === "W" || key === " " || key === "Spacebar") {
      if (!this.jump) this.jumpPressed = true;
      this.jump = true;
    }
    if (key === "Enter") this.confirmPressed = true;
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === "ArrowLeft" || key === "a" || key === "A") this.left = false;
    if (key === "ArrowRight" || key === "d" || key === "D") this.right = false;
    if (key === "ArrowUp" || key === "w" || key === "W" || key === " " || key === "Spacebar") {
      this.jump = false;
    }
  };

  private releaseAll = () => {
    this.left = false;
    this.right = false;
    this.jump = false;
  };

  consumeJumpPress(): boolean {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  consumeConfirm(): boolean {
    const pressed = this.confirmPressed || this.clickConfirm;
    this.confirmPressed = false;
    this.clickConfirm = false;
    return pressed;
  }

  consumeMenuLeft(): boolean {
    const pressed = this.menuLeftPressed;
    this.menuLeftPressed = false;
    return pressed;
  }

  consumeMenuRight(): boolean {
    const pressed = this.menuRightPressed;
    this.menuRightPressed = false;
    return pressed;
  }

  consumePointer(): Pointer | null {
    const pointer = this.pointer;
    this.pointer = null;
    return pointer;
  }
}
