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

export default class Controller {
  constructor(model) {
    this._model = model;
    this._init();
  }

  _init() {
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

    this._buttonState = {};
  }

  buttonPressed(button) {
    switch (button) {
      case Gamepad.A:
        //this._model.shoot();
        break;
      case Gamepad.B:
        this._model.setModeColorAndDistance();
        break;
      case Gamepad.X:
        this._model.setModeDistance();
        break;
      case Gamepad.Y:
        this._model.setModeColor();
        break;
      case Gamepad.L:
        this._model.decreaseBottomColor();
        break;
      case Gamepad.R:
        this._model.increaseBottomColor();
        break;
      case Gamepad.ZL:
        this._model.decreaseTopColor();
        break;
      case Gamepad.ZR:
        this._model.increaseTopColor();
        break;
      case Gamepad.DPadU:
      case Gamepad.DPadD:
        this._model.lookCenter();
        break;
      case Gamepad.DPadL:
        this._model.lookLeft();
        break;
      case Gamepad.DPadR:
        this._model.lookRight();
        break;
      // TODO: Remote Button
    }
  }

  axisState(num, axis) {
    switch (num) {
      case Gamepad.Axis.LY:
        this._model.moveLeftTrack(-axis * 100);
        break;
      case Gamepad.Axis.RY:
        this._model.moveRightTrack(-axis * 100);
        break;
    }
  }

  update() {
    const gamepad = navigator.getGamepads()[0];
    if (!gamepad) {
      return;
    }
    gamepad.buttons.forEach((button, num) => {
      const pressed = button.pressed;
      if (pressed) {
        if (!this._buttonState[num]) {
          this.buttonPressed(num);
        }
        this._buttonState[num] = true;
      } else {
        this._buttonState[num] = false;
      }
    });

    gamepad.axes.forEach((axis, num) => {
      this.axisState(num, axis);
    });
  }
}
