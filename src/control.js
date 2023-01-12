const Gamepad = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  L: 4,
  R: 5,
  ZL: 6,
  ZR: 7,
  Minus: 8,
  Plus: 9,
  DPadU: 12,
  DPadD: 13,
  DPadL: 14,
  DPadR: 15,
  Axis: {
    LX: 0,
    LY: 1,
    RX: 2,
    RY: 3
  }
};

export default class Control {

  constructor(robot, virtualJoyStick) {
    this.robot = robot;
    this.virtualJoyStick = virtualJoyStick;
    this._init();
  }

  _init() {
    this._gamePadButtonState = {};
    if (window.ongamepadconnected) {
      return;
    }
    window.addEventListener("gamepadconnected", (event) => {
      console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        event.gamepad.index,
        event.gamepad.id,
        event.gamepad.buttons.length,
        event.gamepad.axes.length
      );
    });
    window.addEventListener("gamepaddisconnected", (event) => {
      console.log("Gamepad disconnected from index %d: %s", event.gamepad.index, event.gamepad.id);
    });

    this._keyState = { x: 0, y: 0, pressed: false };
    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) {
        return;
      }
      switch (event.code) {
        case "ArrowUp":
          this._keyState.y = 1;
          this._keyState.pressed = true;
          break;
        case "ArrowDown":
          this._keyState.y = -1;
          this._keyState.pressed = true;
          break;
        case "ArrowLeft":
          this._keyState.x = -1;
          this._keyState.pressed = true;
          break;
        case "ArrowRight":
          this._keyState.x = 1;
          this._keyState.pressed = true;
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.defaultPrevented) {
        return;
      }
      switch (event.code) {
        case "ArrowUp":
          this._keyState.y = 0;
          break;
        case "ArrowDown":
          this._keyState.y = 0;
          break;
        case "ArrowLeft":
          this._keyState.x = 0;
          break;
        case "ArrowRight":
          this._keyState.x = 0;
          break;
      }
    });
  }

  gamepadButtonPressed(button) {
    switch (button) {
      case Gamepad.A:
        this.robot.shoot();
        break;
      case Gamepad.B:
        this.robot.setModeColorAndDistance();
        break;
      case Gamepad.X:
        this.robot.setModeDistance();
        break;
      case Gamepad.Y:
        this.robot.setModeColor();
        break;
      case Gamepad.L:
        this.robot.decreaseBottomColor();
        break;
      case Gamepad.R:
        this.robot.increaseBottomColor();
        break;
      case Gamepad.ZL:
        this.robot.decreaseTopColor();
        break;
      case Gamepad.ZR:
        this.robot.increaseTopColor();
        break;
      case Gamepad.DPadU:
      case Gamepad.DPadD:
        this.robot.lookCenter();
        break;
      case Gamepad.DPadL:
        this.robot.lookLeft();
        break;
      case Gamepad.DPadR:
        this.robot.lookRight();
        break;
      case Gamepad.Plus:
        this.robot.singleStick = true;
        break;
      case Gamepad.Minus:
        this.robot.singleStick = false;
        break;
    }
  }

  async gamepadSingleAxisUpdate(axis, value) {
    if (!this.robot.singleStick) {
      switch (axis) {
        case Gamepad.Axis.LY:
          await this.robot.manualMoveLeftTrack(value * 100);
          break;
        case Gamepad.Axis.RY:
          await this.robot.manualMoveRightTrack(value * 100);
          break;
      }
    }
  }

  async gamepadMultipleAxisUpdate(position) {
    if (this.robot.singleStick) {
      await this.move(position);
    }
  }

  async virtualJoystickUpdate(position) {
    await this.move(position);
  }

  async keyboardUpdate(position) {
    await this.move(position);
  }

  async move({ x, y }) {
    const signY = Math.sign(y) || 1;
    let leftSpeed = y + signY * x;
    let rightSpeed = y + signY * -x;
    const max = Math.max(Math.abs(leftSpeed), Math.abs(rightSpeed));
    if (max !== 0) {
      leftSpeed = leftSpeed / max * 100;
      rightSpeed = rightSpeed / max * 100;
    }
    console.log(leftSpeed, rightSpeed);
    await this.robot.manualMoveTracks(leftSpeed, rightSpeed);
  }

  update() {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      gamepad.buttons.forEach((button, num) => {
        const pressed = button.pressed;
        if (pressed) {
          if (!this._gamePadButtonState[num]) {
            this.gamepadButtonPressed(num);
          }
          this._gamePadButtonState[num] = true;
        } else {
          this._gamePadButtonState[num] = false;
        }
      });
      gamepad.axes.forEach((axis, num) => {
        this.gamepadSingleAxisUpdate(num, -axis);
      });
      this.gamepadMultipleAxisUpdate({
        x: -gamepad.axes[Gamepad.Axis.LX],
        y: -gamepad.axes[Gamepad.Axis.LY]
      });
    }

    if (this.virtualJoyStick) {
      if (this.virtualJoyStick.IsPressed()) {
        this.virtualJoystickUpdate({
          x: this.virtualJoyStick.GetX() / 100,
          y: this.virtualJoyStick.GetY() / 100,
        });
        this.virtualJoyStick.released = false;
      } else if (!this.virtualJoyStick.released) {
        this.virtualJoystickUpdate({
          x: 0,
          y: 0,
        });
        this.virtualJoyStick.released = true;
      }
    }

    if (this._keyState.pressed) {
      this.keyboardUpdate(this._keyState);
      if (this._keyState.x === 0 && this._keyState.y === 0) {
        this._keyState.pressed = false;
      }
    }
  }
}
