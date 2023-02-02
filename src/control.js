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
  Home: 16,
  Record: 17,
  Axis: {
    LX: 0,
    LY: 1,
    RX: 2,
    RY: 3
  }
};

export default class Control {
  constructor(robot) {
    this.robot = robot;
    this.virtualJoyStick = new JoyStick("joystick", {
      internalFillColor: "#555555",
      internalStrokeColor: "#000000",
      externalStrokeColor: "#000000"
    });
    this._init();
  }

  _init() {
    this._gamePadState = { button: {}, axis: false };
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
      case Gamepad.Home:
        break;
      case Gamepad.Record:
        if ([this.robot.const.Status.MANUAL, this.robot.const.Status.STOPPED].includes(this.robot.status)) {
          this.robot.start();
        } else {
          this.robot.stop();
        }
        break;
      case Gamepad.Minus:
        this.robot.setControlModeSingle();
        break;
      case Gamepad.Plus:
        this.robot.setControlModeDouble();
        break;
    }
  }

  async gamepadAxisUpdate(axes) {
    if (this.robot.controlMode === this.robot.const.ControlMode.SINGLE_STICK) {
      const position = {
        x: axes[Gamepad.Axis.LX],
        y: -axes[Gamepad.Axis.LY]
      };
      await this.move(position);
    } else if (this.robot.controlMode === this.robot.const.ControlMode.DOUBLE_STICK) {
      const leftSpeed = -axes[Gamepad.Axis.LY] * 100;
      const rightSpeed = -axes[Gamepad.Axis.RY] * 100;
      await this.robot.manualMove(leftSpeed, rightSpeed);
    }
  }

  async virtualJoystickUpdate(position) {
    await this.move(position);
  }

  async keyboardUpdate(position) {
    await this.move(position);
  }

  async move({ x, y }) {
    const direction = y >= -0.25 ? 1 : -1;
    let leftSpeed = y + direction * x;
    let rightSpeed = y + direction * -x;
    const max = Math.max(Math.abs(leftSpeed), Math.abs(rightSpeed));
    if (max !== 0) {
      leftSpeed = (leftSpeed / max) * 100;
      rightSpeed = (rightSpeed / max) * 100;
    }
    await this.robot.manualMove(leftSpeed, rightSpeed);
  }

  selectGamepad() {
    let selectedGamepad = null;
    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad) {
        continue;
      }
      if (!selectedGamepad || gamepad.buttons.length > selectedGamepad.buttons.length) {
        selectedGamepad = gamepad;
      }
    }
    return selectedGamepad;
  }

  update() {
    const gamepad = this.selectGamepad();
    if (gamepad) {
      gamepad.buttons.forEach((button, num) => {
        const pressed = button.pressed;
        if (pressed) {
          if (!this._gamePadState.button[num]) {
            this.gamepadButtonPressed(num);
          }
          this._gamePadState.button[num] = true;
        } else {
          this._gamePadState.button[num] = false;
        }
      });
      if (this._gamePadState.axis) {
        this.gamepadAxisUpdate(gamepad.axes);
      }
      this._gamePadState.axis = !!gamepad.axes.find((axis) => Math.abs(axis) !== 0);
    }

    if (this.virtualJoyStick) {
      if (this.virtualJoyStick.IsPressed()) {
        this.virtualJoystickUpdate({
          x: this.virtualJoyStick.GetX() / 100,
          y: this.virtualJoyStick.GetY() / 100
        });
        this.virtualJoyStick.released = false;
      } else if (!this.virtualJoyStick.released) {
        this.virtualJoystickUpdate({
          x: 0,
          y: 0
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
