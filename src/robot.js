import APIPoweredUp from "apiPoweredUp";
import APIMoveHub from "apiMoveHub";

const Mode = {
  COLOR: 0x00,
  DISTANCE: 0x01,
  LED: 0x05,
  COLOR_AND_DISTANCE: 0x08
};

const ControlMode = {
  SINGLE_STICK: 0,
  DOUBLE_STICK: 1
};

const APIVersion = {
  PoweredUP: 1,
  MoveHub: 2
};

const Status = {
  MANUAL: 0,
  STARTED: 1,
  WAIT: 1,
  SCAN: 2,
  TURN: 3,
  MOVE: 4,
  BLOCKED: 5,
  STOPPED: 99
};

const Color = {
  BLACK: 0,
  PINK: 1,
  PURPLE: 2,
  BLUE: 3,
  LIGHT_BLUE: 4,
  CYAN: 5,
  GREEN: 6,
  YELLOW: 7,
  ORANGE: 8,
  RED: 9,
  WHITE: 10
};

const HEXColor = {
  [Color.BLACK]: "#000000",
  [Color.PINK]: "#FA91E1",
  [Color.PURPLE]: "#D870FF",
  [Color.BLUE]: "#477DE9",
  [Color.LIGHT_BLUE]: "#47B5E9",
  [Color.CYAN]: "#64F5B1",
  [Color.GREEN]: "#53E947",
  [Color.YELLOW]: "#FBFB58",
  [Color.ORANGE]: "#FAA51B",
  [Color.RED]: "#FC4732",
  [Color.WHITE]: "#FFFFFF"
};

const TopColor = {
  BLACK: Color.BLACK,
  BLUE: Color.BLUE,
  GREEN: Color.CYAN,
  RED: Color.RED
};

const HeadOrientation = {
  CENTER: 0,
  LEFT: 1,
  RIGHT: 2
};

const BodyOrientation = {
  UNKNOWN: 0,
  UP: 1,
  UPSIDE_DOWN: 2,
  FRONT: 3,
  BACK: 4,
  LEFT: 5,
  RIGHT: 6,
  LEAN_FRONT: 7,
  LEAN_BACK: 8,
  LEAN_LEFT: 9,
  LEAN_RIGHT: 10
};

const Constants = {
  HEAD_LOOK_ANGLE: 20,
  HEAD_TURN_SPEED: 50,
  HEAD_TURN_ANGLE: 30,
  HEAD_SHOOT_ANGLE: 100,
  TRACK_MAX_POWER: 50,
  BODY_MOVE_SPEED: 50,
  BODY_TURN_SPEED: 100,
  BODY_STOP_DISTANCE: 200
};

// TODO:
//  - Scan: turn 360, record distances, and visualize on map
//  - Build up map, record/invalidate blocks, update position on map
//  - AI: Forwards, Stop, Backwards, Turn Left, Turn right, Look Left, Look Right

class EventEmitter {
  constructor() {
    this.callbacks = {};
  }

  on(event, cb) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(cb);
  }

  emit(event, data) {
    let cbs = this.callbacks[event];
    if (cbs) {
      cbs.forEach((cb) => cb(data));
    }
  }
}

export default class Robot extends EventEmitter {
  constructor() {
    super();
    this._api = null;
    this._apiVersion = APIVersion.PoweredUP;
    this._init();
    this.const = {
      APIVersion,
      Mode,
      ControlMode,
      Status,
      Color,
      TopColor,
      HeadOrientation,
      BodyOrientation
    };
    this._prepare();
  }

  _prepare() {
    Object.keys(this.const).forEach((name) => {
      this.const[name].ui = () => {
        return Object.keys(this.const[name]).reduce((result, key) => {
          if (typeof this.const[name][key] === "function") {
            return result;
          }
          const uiKey = key.toLowerCase().replaceAll("_", " ").replaceAll(" and ", " & ");
          result[uiKey] = this.const[name][key];
          return result;
        }, {});
      };
    });
  }

  _init() {
    this._name = "";
    this._status = Status.MANUAL;
    this._mode = Mode.DISTANCE;
    this._controlMode = ControlMode.SINGLE_STICK;
    this._topColor = TopColor.BLACK;
    this._bottomColor = Color.BLUE;
    this._maxPower = Constants.TRACK_MAX_POWER;
    this._friction = 1;
    this._acceleration = 0;
    this._deceleration = 0;
    this._battery = 0;
    this._batteryUpdated = false;
    this._tilt = this._tilt || {};
    this._tilt.x = 0;
    this._tilt.y = 0;
    this._bodyOrientation = BodyOrientation.UNKNOWN;
    this._headOrientation = HeadOrientation.CENTER;
    this._color = Color.BLACK;
    this._distance = 0;
    this._rotation = 0;
    this._button = false;
    this._remoteButton = false;
    this._current = 0;
    this._voltage = 0;
  }

  async connect() {
    if (this.connected) {
      return;
    }
    if (!navigator.bluetooth) {
      alert("Browser does not support bluetooth connections");
      return;
    }
    switch (this.apiVersion) {
      case APIVersion.PoweredUP:
        this._api = new APIPoweredUp(this);
        break;
      case APIVersion.MoveHub:
        this._api = new APIMoveHub(this);
        break;
    }
    await this._api.connect();
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }
    await this._api.disconnect();
    this._api = null;
  }

  _connected() {
    this._init();
    this._name = this.api.name;
    this.maxPower = Constants.TRACK_MAX_POWER;
    this.acceleration = 0;
    this.deceleration = 0;
    console.log(`Connected to ${this.name}!`);

    this.hud.apiVersion.disable();
    this.hud.connectButton.disable();
    this.hud.disconnectButton.enable();
    this.hud.startButton.enable();
    this.hud.stopButton.disable();
    this.hud.shootButton.enable();
    this.hud.lookCenterButton.enable();
    this.hud.lookLeftButton.enable();
    this.hud.lookRightButton.enable();
    this.hud.turnLeftButton.enable();
    this.hud.turnRightButton.enable();
    this.hud.turnAroundButton.enable();
    this.hud.turnFullButton.enable();
    this.hud.moveUntilButton.enable();
    this.hud.topColorButton.enable();
    this.hud.bottomColorButton.enable();
    this.hud.modeButton.enable();
    this.hud.controlModeButton.enable();
    this.hud.maxPower.enable();
    this.hud.friction.enable();
    this.hud.acceleration.enable();
    this.hud.deceleration.enable();
  }

  _disconnected() {
    console.log(`Disconnected from hub ${this._name}!`);
    this._name = "";
    this._api = null;

    this.hud.apiVersion.enable();
    this.hud.connectButton.enable();
    this.hud.disconnectButton.disable();
    this.hud.startButton.disable();
    this.hud.stopButton.disable();
    this.hud.shootButton.disable();
    this.hud.lookCenterButton.disable();
    this.hud.lookLeftButton.disable();
    this.hud.lookRightButton.disable();
    this.hud.turnLeftButton.disable();
    this.hud.turnRightButton.disable();
    this.hud.turnAroundButton.disable();
    this.hud.turnFullButton.disable();
    this.hud.moveUntilButton.disable();
    this.hud.topColorButton.disable();
    this.hud.bottomColorButton.disable();
    this.hud.modeButton.disable();
    this.hud.controlModeButton.disable();
    this.hud.maxPower.disable();
    this.hud.friction.disable();
    this.hud.acceleration.disable();
    this.hud.deceleration.disable();
  }

  manual() {
    this.status = Status.MANUAL;
  }

  async wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  async start() {
    if (!this.connected) {
      return;
    }
    this.status = Status.STARTED;
    this.hud.startButton.disable();
    this.hud.stopButton.enable();
    await this.countdown();
    await this.scan();
  }

  async countdown() {
    if (!this.connected) {
      return;
    }
    await this.wait(1000);
    await this.setLEDColor(Color.RED);
    await this.wait(1000);
    await this.setLEDColor(Color.YELLOW);
    await this.wait(1000);
    await this.setLEDColor(Color.GREEN);
    await this.wait(1000);
  }

  async scan() {
    if (!this.connected) {
      return;
    }
    this.status = Status.SCAN;
    // TODO: Turn 360
  }

  async stop() {
    if (!this.connected) {
      return;
    }
    this.status = Status.STOPPED;
    this.hud.startButton.enable();
    this.hud.stopButton.disable();
  }

  async shoot(speed = Constants.HEAD_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.api.rotateHead(Constants.HEAD_SHOOT_ANGLE - this.rotation, speed);
    await this.lookCenter();
  }

  async lookCenter(speed = Constants.HEAD_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.api.rotateHead(-this.rotation, speed);
  }

  async lookRight(speed = Constants.HEAD_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.api.rotateHead(Constants.HEAD_TURN_ANGLE - this.rotation, speed);
  }

  async lookLeft(speed = Constants.HEAD_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.api.rotateHead(-Constants.HEAD_TURN_ANGLE - this.rotation, speed);
  }

  async lookAtAngle(angle = 0, speed = Constants.HEAD_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.api.rotateHead(angle - this.rotation, speed);
  }

  async stopMove() {
    if (!this.connected) {
      return;
    }
    await this.api.stop();
  }

  async manualMove(speedLeft, speedRight) {
    if (!this.connected) {
      return;
    }
    this.status = Status.MANUAL;
    // TODO: Accelerate: =0
    await this.api.move(speedLeft, speedRight);
  }

  async manualTurnLeft(speed = Constants.BODY_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.manualTurn(-90, speed);
  }

  async manualTurnRight(speed = Constants.BODY_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.manualTurn(90, speed);
  }

  async manualTurnAround(speed = Constants.BODY_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.manualTurn(180, speed);
  }

  async manualTurnFull(speed = Constants.BODY_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    await this.manualTurn(360, speed);
  }

  async manualTurn(degrees, speed = Constants.BODY_TURN_SPEED) {
    if (!this.connected) {
      return;
    }
    this.status = Status.MANUAL;
    // TODO: Accelerate: >0
    await this.api.turn(degrees, speed);
  }

  async manualMoveUntil() {
    // TODO
  }

  async turn(speed = Constants.BODY_TURN_SPEED, time) {
    if (!this.connected) {
      return;
    }
    if (this.status === Status.TURN) {
      return;
    }
    this.status = Status.TURN;
    await this.api.turn(speed, time);
  }

  async turnAngle(speed = Constants.BODY_TURN_SPEED, angle) {
    if (!this.connected) {
      return;
    }
    await this.turn(speed, this._turnTimeForAngle(angle));
  }

  async moveUntil(speed = Constants.BODY_MOVE_SPEED) {
    if (!this.connected) {
      return;
    }
    if (this.status === Status.MOVE) {
      return;
    }
    this.status = Status.MOVE;
    await this.api.move(speed, speed);
    const stop = this.loop(async () => {
      if (this.distance < Constants.BODY_STOP_DISTANCE && this.status === Mode.MOVE) {
        await this.stop();
        this.status = Status.BLOCKED;
        stop();
      } else if (this.status !== Mode.MOVE) {
        stop();
      }
    });
  }

  async turnUntil(speed = Constants.BODY_TURN_SPEED, time) {
    if (!this.connected) {
      return;
    }
    // TODO: Check for distance
  }

  get color() {
    return this._color;
  }

  _setColor(color) {
    this._color = color;
    this.emit("color", color);
  }

  get topColor() {
    return this._topColor;
  }

  set topColor(color) {
    if (!this.connected) {
      return;
    }
    this.setModeLED();
    this._topColor = color;
    this.api.setSensorColor(color);
  }

  get bottomColor() {
    return this._bottomColor;
  }

  set bottomColor(color) {
    if (!this.connected) {
      return;
    }
    this._bottomColor = color;
    this.api.setLEDColor(color);
  }

  get hexColor() {
    if (!this.connected) {
      return HEXColor[Color.BLACK];
    }
    return HEXColor[this._color];
  }

  get hexTopColor() {
    if (!this.connected) {
      return HEXColor[Color.BLACK];
    }
    return HEXColor[this._topColor];
  }

  get hexBottomColor() {
    if (!this.connected) {
      return HEXColor[Color.BLACK];
    }
    return HEXColor[this._bottomColor];
  }

  get hexBatteryColor() {
    if (!this.connected) {
      return HEXColor[Color.BLACK];
    }
    if (!this._batteryUpdated) {
      return HEXColor[Color.BLACK];
    }
    if (this.battery >= 20) {
      return HEXColor[Color.GREEN];
    } else if (this.battery >= 10) {
      return HEXColor[Color.YELLOW];
    }
    return HEXColor[Color.RED];
  }

  setTopColorBlack() {
    this.topColor = TopColor.BLACK;
  }

  setTopColorBlue() {
    this.topColor = TopColor.BLUE;
  }

  setTopColorGreen() {
    this.topColor = TopColor.GREEN;
  }

  setTopColorRed() {
    this.topColor = TopColor.RED;
  }

  increaseTopColor() {
    let color = this._topColor;
    switch (color) {
      case TopColor.BLACK:
        color = TopColor.BLUE;
        break;
      case TopColor.BLUE:
        color = TopColor.GREEN;
        break;
      case TopColor.GREEN:
        color = TopColor.RED;
        break;
      case TopColor.RED:
        color = TopColor.BLACK;
        break;
    }
    this.topColor = color;
  }

  decreaseTopColor() {
    let color = this._topColor;
    switch (color) {
      case TopColor.BLACK:
        color = TopColor.RED;
        break;
      case TopColor.BLUE:
        color = TopColor.BLACK;
        break;
      case TopColor.GREEN:
        color = TopColor.BLUE;
        break;
      case TopColor.RED:
        color = TopColor.GREEN;
        break;
    }
    this.topColor = color;
  }

  setBottomColorBlack() {
    this.bottomColor = Color.BLACK;
  }

  setBottomColorPink() {
    this.bottomColor = Color.PINK;
  }

  setBottomColorPurple() {
    this.bottomColor = Color.PURPLE;
  }

  setBottomColorBlue() {
    this.bottomColor = Color.BLUE;
  }

  setBottomColorLightBlue() {
    this.bottomColor = Color.LIGHT_BLUE;
  }

  setBottomColorCyan() {
    this.bottomColor = Color.CYAN;
  }

  setBottomColorGreen() {
    this.bottomColor = Color.GREEN;
  }

  setBottomColorYellow() {
    this.bottomColor = Color.YELLOW;
  }

  setBottomColorOrange() {
    this.bottomColor = Color.ORANGE;
  }

  setBottomColorRed() {
    this.bottomColor = Color.RED;
  }

  setBottomColorWhite() {
    this.bottomColor = Color.WHITE;
  }

  increaseBottomColor() {
    this.bottomColor = this._bottomColor < Color.WHITE ? this._bottomColor + 1 : Color.BLACK;
  }

  decreaseBottomColor() {
    this.bottomColor = this._bottomColor > Color.BLACK ? this._bottomColor - 1 : Color.WHITE;
  }

  async setLEDColor(color) {
    if (!this.connected) {
      return;
    }
    this._bottomColor = color;
    await this.api.setLEDColor(color);
  }

  onButtonDown() {}

  onButtonUp() {}

  onRemoteButtonDown() {}

  onRemoteButtonUp() {}

  get name() {
    return this._name;
  }

  get connected() {
    return !!this.api?.connected;
  }

  get apiVersion() {
    return this._apiVersion;
  }

  set apiVersion(apiVersion) {
    this._apiVersion = apiVersion;
  }

  get api() {
    return this._api;
  }

  get status() {
    return this._status;
  }

  set status(status) {
    this._status = status;
  }

  setModeColor() {
    this.mode = Mode.COLOR;
  }

  setModeColorAndDistance() {
    this.mode = Mode.COLOR_AND_DISTANCE;
  }

  setModeDistance() {
    this.mode = Mode.DISTANCE;
  }

  setModeLED() {
    this.mode = Mode.LED;
  }

  get mode() {
    return this._mode;
  }

  set mode(mode) {
    if (!this.connected) {
      return;
    }
    this._distance = 0;
    this._color = 0;
    this._mode = mode;
    this._topColor = TopColor.BLACK;
    this.api.setSensorMode(mode);
  }

  get controlMode() {
    return this._controlMode;
  }

  set controlMode(controlMode) {
    this._controlMode = controlMode;
  }

  setControlModeSingle() {
    this.controlMode = ControlMode.SINGLE_STICK;
  }

  setControlModeDouble() {
    this.controlMode = ControlMode.DOUBLE_STICK;
  }

  get battery() {
    return this._battery;
  }

  _setBattery(battery) {
    const previousBattery = this._battery;
    this._battery = battery;
    this._batteryUpdated = true;
    if (previousBattery > 20 && battery <= 20) {
      this.emit("battery", 20);
    }
    if (previousBattery > 10 && battery <= 10) {
      this.emit("battery", 10);
    }
    if (previousBattery > 5 && battery <= 5) {
      this.emit("battery", 5);
    }
  }

  get tilt() {
    return this._tilt;
  }

  _setTilt(tilt) {
    const previousOrientation = this._bodyOrientation;
    this._tilt.x = tilt.x;
    this._tilt.y = tilt.y;
    if (this._tilt.y >= 10) {
      this._bodyOrientation = BodyOrientation.UPSIDE_DOWN;
    } else if (Math.abs(this._tilt.x) <= 10 && this._tilt.y < -80) {
      this._bodyOrientation = BodyOrientation.UP;
    } else if (this._tilt.x > 10 && this._tilt.x < 80) {
      this._bodyOrientation = BodyOrientation.LEAN_LEFT;
    } else if (this._tilt.x >= 80) {
      this._bodyOrientation = BodyOrientation.LEFT;
    } else if (this._tilt.x < -5 && this._tilt.x > -80) {
      this._bodyOrientation = BodyOrientation.LEAN_RIGHT;
    } else if (this._tilt.x < -80) {
      this._bodyOrientation = BodyOrientation.RIGHT;
    } else if (this._tilt.y > -80 && this._tilt.y < -10) {
      this._bodyOrientation = BodyOrientation.LEAN_BACK;
    } else if (this._tilt.y > -10) {
      this._bodyOrientation = BodyOrientation.BACK;
    } else {
      this._bodyOrientation = BodyOrientation.UNKNOWN;
    }
    if (previousOrientation !== this.bodyOrientation) {
      this.emit("orientation", this.bodyOrientation);
    }
  }

  get bodyOrientation() {
    return this._bodyOrientation;
  }

  get headOrientation() {
    return this._headOrientation;
  }

  get distance() {
    return this._distance;
  }

  _setDistance(distance) {
    const previousDistance = this._distance;
    this._distance = distance;
    if (previousDistance > 20 && distance <= 20) {
      this.emit("distance", 20);
    }
    if (previousDistance > 10 && distance <= 10) {
      this.emit("distance", 15);
    }
    if (previousDistance > 5 && distance <= 5) {
      this.emit("distance", 5);
    }
  }

  get rotation() {
    return this._rotation;
  }

  _setRotation(degrees) {
    this._rotation = degrees;
    if (this._rotation <= -Constants.HEAD_LOOK_ANGLE) {
      this._headOrientation = HeadOrientation.LEFT;
    } else if (this._rotation >= Constants.HEAD_LOOK_ANGLE) {
      this._headOrientation = HeadOrientation.RIGHT;
    } else {
      this._headOrientation = HeadOrientation.CENTER;
    }
  }

  get button() {
    return this._button;
  }

  _setButton(pressed) {
    this._button = pressed;
    if (this._button) {
      this.onButtonDown();
      this.emit("button", { pressed: true });
    } else {
      this.onButtonUp();
      this.emit("button", { pressed: false });
    }
  }

  get remoteButton() {
    return this._remoteButton;
  }

  _setRemoteButton(pressed) {
    this._remoteButton = pressed;
    if (this._remoteButton) {
      this.onRemoteButtonDown();
      this.emit("remoteButton", { pressed: true });
    } else {
      this.onRemoteButtonUp();
      this.emit("remoteButton", { pressed: false });
    }
  }

  get current() {
    return this._current;
  }

  _setCurrent(current) {
    this._current = current;
  }

  get voltage() {
    return this._voltage;
  }

  _setVoltage(voltage) {
    this._voltage = voltage;
  }

  get maxPower() {
    return this._maxPower;
  }

  set maxPower(maxPower) {
    if (!this.connected) {
      return;
    }
    this._maxPower = maxPower;
    this.api.setMaxPower(maxPower);
  }

  get friction() {
    return this._friction;
  }

  set friction(friction) {
    this._friction = friction;
  }

  get acceleration() {
    return this._acceleration;
  }

  set acceleration(time) {
    if (!this.connected) {
      return;
    }
    this._acceleration = time;
    this.api.setAcceleration(time);
  }

  get deceleration() {
    return this._deceleration;
  }

  set deceleration(time) {
    if (!this.connected) {
      return;
    }
    this._deceleration = time;
    this.api.setDeceleration(time);
  }

  update() {
    switch (this.status) {
      case Status.MANUAL:
      case Status.STARTED:
      case Status.STOPPED:
      default:
        break;
      case Status.SCAN:
        this.stop();
        break;
    }
  }

  call(time, fn) {
    const handle = setTimeout(() => {
      fn && fn();
    }, time);
    return () => {
      clearTimeout(handle);
    };
  }

  loop(fn) {
    const handle = setInterval(() => {
      fn && fn();
    }, 10);
    return () => {
      clearInterval(handle);
    };
  }
}
