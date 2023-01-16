const Mode = {
  COLOR: 0x00,
  DISTANCE: 0x01,
  LED: 0x05,
  COLOR_AND_DISTANCE: 0x08
};

const ControlMode = {
  SINGLE_STICK: 0,
  DOUBLE_STICK: 1,
}

const Status = {
  MANUAL: 0,
  STARTED: 1,
  SCAN: 2,
  STOPPED: 99
};

const Color = {
  [PoweredUP.Consts.Color.BLACK]: "#000000",
  [PoweredUP.Consts.Color.PINK]: "#FA91E1",
  [PoweredUP.Consts.Color.PURPLE]: "#D870FF",
  [PoweredUP.Consts.Color.BLUE]: "#477DE9",
  [PoweredUP.Consts.Color.LIGHT_BLUE]: "#47B5E9",
  [PoweredUP.Consts.Color.CYAN]: "#64F5B1",
  [PoweredUP.Consts.Color.GREEN]: "#53E947",
  [PoweredUP.Consts.Color.YELLOW]: "#FBFB58",
  [PoweredUP.Consts.Color.ORANGE]: "#FAA51B",
  [PoweredUP.Consts.Color.RED]: "#FC4732",
  [PoweredUP.Consts.Color.WHITE]: "#FFFFFF"
};

const TopColor = {
  OFF: 0,
  BLUE: 3,
  GREEN: 5,
  RED: 9
}

const BottomColor = {
  OFF: 0,
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
}

const HeadOrientation = {
  CENTER: 0,
  LEFT: 1,
  RIGHT: 2,
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
  LEAN_RIGHT: 10,
};

const Constants = {
  HEAD_LOOK_ANGLE: 20,
  HEAD_TURN_SPEED: 50,
  HEAD_TURN_ANGLE: 30,
  HEAD_SHOOT_ANGLE: 90,
  TRACK_MAX_POWER: 50
};

// TODO:
//  - Scan: turn 360, record distances, and visualize on map
//  - Build up map, record/invalidate blocks, update position on map
//  - AI: Forwards, Stop, Backwards, Turn Left, Turn right, Look Left, Look Right

class EventEmitter {
  constructor() {
    this.callbacks = {}
  }

  on(event, cb) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(cb)
  }

  emit(event, data) {
    let cbs = this.callbacks[event]
    if (cbs) {
      cbs.forEach(cb => cb(data))
    }
  }
}

export default class Robot extends EventEmitter {
  constructor() {
    super();
    this._init();
    this.const = {
      Mode,
      ControlMode,
      Status,
      Color,
      TopColor,
      BottomColor,
      HeadOrientation,
      BodyOrientation,
    }
  }

  _init() {
    this._name = "";
    this._conntected = false;
    this._status = Status.MANUAL;
    this._mode = Mode.DISTANCE;
    this._controlMode = ControlMode.SINGLE_STICK;
    this._topColor = PoweredUP.Consts.Color.BLACK;
    this._bottomColor = PoweredUP.Consts.Color.BLUE;
    this._maxPower = Constants.TRACK_MAX_POWER;
    this._accelerate = true;
    this._accelerationTime = 0;
    this._decelerate = true;
    this._decelerationTime = 0;
    this._battery = 0;
    this._tilt = this._tilt || {};
    this._tilt.x = 0;
    this._tilt.y = 0;
    this._bodyOrientation = BodyOrientation.UNKNOWN;
    this._headOrientation = HeadOrientation.CENTER;
    this._color = PoweredUP.Consts.Color.BLACK;
    this._distance = 0;
    this._rotation = 0;
    this._button = false;
    this._remoteButton = false;
    this._current = 0;
    this._voltage = 0;
  }

  async connect() {
    await new Promise((resolve, reject) => {
      try {
        const poweredUP = new window.PoweredUP.PoweredUP();
        poweredUP.on("discover", async (hub) => {
          hub.on("attach", (device) => {
            console.log(`Device ${ device.typeName } attached to port ${ device.portName }`);
          });
          hub.on("disconnect", () => {
            this._disconnected();
          });
          await hub.connect();
          this._connected(hub);
          resolve(hub);
        });
        poweredUP.scan();
        console.log("Scanning...");
      } catch (err) {
        this._connected();
        reject(err);
      }
    });
  }

  async _connected(hub) {
    this._init();
    this._hub = hub;
    this._name = hub.name;
    await this._mount();
    this._observe();
    this._conntected = true;
    console.log(`Connected to ${ hub.name }!`);

    this.gui.startButton.enable();
    this.gui.stopButton.disable();
    this.gui.shootButton.enable();
    this.gui.lookCenterButton.enable();
    this.gui.lookLeftButton.enable();
    this.gui.lookRightButton.enable();
    this.gui.topColorButton.enable();
    this.gui.bottomColorButton.enable();
    this.gui.modeButton.enable();
    this.gui.controlModeButton.enable();
    this.gui.maxPower.enable();
    this.gui.accelerate.enable();
    this.gui.accelerationTime.enable();
    this.gui.decelerate.enable();
    this.gui.decelerationTime.enable();
  }

  _disconnected() {
    console.log(`Disconnected from hub!`);
    this._hub = null;
    this._name = "";
    this._conntected = false;

    this.gui.startButton.disable();
    this.gui.stopButton.disable();
    this.gui.shootButton.disable();
    this.gui.lookCenterButton.disable();
    this.gui.lookLeftButton.disable();
    this.gui.lookRightButton.disable();
    this.gui.topColorButton.disable();
    this.gui.bottomColorButton.disable();
    this.gui.modeButton.disable();
    this.gui.controlModeButton.disable();
    this.gui.maxPower.disable();
    this.gui.accelerate.disable();
    this.gui.accelerationTime.disable();
    this.gui.decelerate.disable();
    this.gui.decelerationTime.disable();
  }

  async _mount() {
    this._leftTrack = await this._hub.waitForDeviceAtPort("A");
    this._rightTrack = await this._hub.waitForDeviceAtPort("B");
    this._bothTracks = await this._hub.waitForDeviceAtPort("AB");
    this._head = await this._hub.waitForDeviceAtPort("D");
    this._colorDistance = await this._hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR); // C
    this._led = await this._hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
    // Defaults
    this._leftTrack.setMaxPower(this._maxPower);
    this._rightTrack.setMaxPower(this._maxPower);
    this._bothTracks.setMaxPower(this._maxPower);
  }

  _observe() {
    this._hub.on("current", (device, { current }) => {
      this._current = current;
    });

    this._hub.on("voltage", (device, { voltage }) => {
      this._voltage = voltage;
    });

    this._hub.on("batteryLevel", ({ batteryLevel }) => {
      const previousBattery = this._battery;
      this._battery = batteryLevel;
      if (previousBattery > 20 && batteryLevel <= 20) {
        this.emit("battery", 20);
      }
      if (previousBattery > 10 && batteryLevel <= 10) {
        this.emit("battery", 10);
      }
      if (previousBattery > 5 && batteryLevel <= 5) {
        this.emit("battery", 10);
      }
    });

    this._hub.on("tilt", (device, { x, y }) => {
      const previousOrientation = this._bodyOrientation;
      this._tilt.x = x;
      this._tilt.y = y;
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
    });

    this._hub.on("color", (device, { color }) => {
      this._color = color;
      this.emit("color", color);
    });

    this._hub.on("colorAndDistance", (device, { color, distance }) => {
      this._color = color;
      this.emit("color", color);

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
    });

    this._hub.on("distance", (device, { distance }) => {
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
    });

    this._hub.on("rotate", (device, { degrees }) => {
      if (device === this._head) {
        this._rotation = degrees;
      }
      if (this._rotation <= -Constants.HEAD_LOOK_ANGLE) {
        this._headOrientation = HeadOrientation.LEFT;
      } else if (this._rotation >= Constants.HEAD_LOOK_ANGLE) {
        this._headOrientation = HeadOrientation.RIGHT;
      } else {
        this._headOrientation = HeadOrientation.CENTER;
      }
    });

    this._hub.on("button", ({ event }) => {
      this._button = event === PoweredUP.Consts.ButtonState.PRESSED;
      if (this._button) {
        this.onButtonDown();
        this.emit("button", { pressed: true });
      } else {
        this.onButtonUp();
        this.emit("button", { pressed: false });
      }
    });

    this._hub.on("remoteButton", (device, { event }) => {
      this._remoteButton = event === PoweredUP.Consts.ButtonState.PRESSED;
      if (this._remoteButton) {
        this.onRemoteButtonDown();
        this.emit("remoteButton", { pressed: true });
      } else {
        this.onRemoteButtonUp();
        this.emit("remoteButton", { pressed: false });
      }
    });
  }

  manual() {
    this.status = Status.MANUAL;
  }

  start() {
    this.status = Status.STARTED;
    setTimeout(() => {
      this.scan();
    }, 1000);
    this.gui.startButton.disable();
    this.gui.stopButton.enable();
  }

  scan() {
    this.status = Status.SCAN;

  }

  stop() {
    this.status = Status.STOPPED;
    this.gui.startButton.enable();
    this.gui.stopButton.disable();
  }

  async shoot() {
    if (this._head) {
      const rotation = Constants.HEAD_SHOOT_ANGLE - this.rotation;
      const degrees = Math.abs(rotation);
      const speed = Constants.HEAD_TURN_SPEED * (rotation > 0 ? 1 : -1);
      await this._head.rotateByDegrees(degrees, speed);
      await this.lookCenter();
    }
  }

  async lookCenter() {
    if (this._head) {
      const degrees = Math.abs(this.rotation);
      const speed = Constants.HEAD_TURN_SPEED * (this.rotation > 0 ? -1 : 1);
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async "look center"() {
    await this.lookCenter();
  }

  async lookRight() {
    if (this._head) {
      const rotation = Constants.HEAD_TURN_ANGLE - this.rotation;
      const degrees = Math.abs(rotation);
      const speed = Constants.HEAD_TURN_SPEED * (rotation > 0 ? 1 : -1);
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async "look right"() {
    await this.lookRight();
  }

  async lookLeft() {
    if (this._head) {
      const rotation = -Constants.HEAD_TURN_ANGLE - this.rotation;
      const degrees = Math.abs(rotation);
      const speed = Constants.HEAD_TURN_SPEED * (rotation > 0 ? 1 : -1);
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async "slook left"() {
    await this.lookLeft();
  }

  async manualMoveLeft(speed) {
    if (this._leftTrack) {
      this.status = Status.MANUAL;
      const relativeSpeed = speed / 100 * this._maxPower;
      await this._leftTrack.setSpeed(relativeSpeed);
    }
  }

  async manualMoveRight(speed) {
    if (this._rightTrack) {
      this.status = Status.MANUAL;
      const relativeSpeed = speed / 100 * this._maxPower;
      await this._rightTrack.setSpeed(relativeSpeed);
    }
  }

  async manualMove(speedLeft, speedRight) {
    if (this._bothTracks) {
      this.status = Status.MANUAL;
      const relativeLeftSpeed = speedLeft / 100 * this._maxPower;
      const relativeRightSpeed = speedRight / 100 * this._maxPower;
      await this._bothTracks.setSpeed([relativeLeftSpeed, relativeRightSpeed]);
    }
  }

  async turn(speed) {
    if (this._bothTracks) {
      const relativeLeftSpeed = speed / 100 * this._maxPower;
      const relativeRightSpeed = -speed / 100 * this._maxPower;
      // TODO: Define speed and time (90, 180, 270, 360)
      await this._bothTracks.setSpeed([relativeLeftSpeed, relativeRightSpeed]);
      // TODO: Sync UI
    }
  }

  get topColor() {
    return this._topColor;
  }

  set topColor(color) {
    if (this._colorDistance) {
      this.setModeLED();
      this._topColor = color;
      this._colorDistance.setColor(color);
    }
  }

  get bottomColor() {
    return this._bottomColor;
  }

  set bottomColor(color) {
    if (this._led) {
      this._bottomColor = color;
      this._led.setColor(color);
    }
  }

  get hexColor() {
    return Color[this._color];
  }

  get hexTopColor() {
    return Color[this._topColor];
  }

  get hexBottomColor() {
    return Color[this._bottomColor];
  }

  setTopColorBlack() {
    this.topColor = PoweredUP.Consts.Color.BLACK;
  }

  setTopColorBlue() {
    this.topColor = PoweredUP.Consts.Color.BLUE;
  }

  setTopColorGreen() {
    this.topColor = PoweredUP.Consts.Color.CYAN;
  }

  setTopColorRed() {
    this.topColor = PoweredUP.Consts.Color.RED;
  }

  increaseTopColor() {
    let color = this._topColor;
    switch (color) {
      case PoweredUP.Consts.Color.BLACK:
        color = PoweredUP.Consts.Color.BLUE;
        break;
      case PoweredUP.Consts.Color.BLUE:
        color = PoweredUP.Consts.Color.CYAN;
        break;
      case PoweredUP.Consts.Color.CYAN:
        color = PoweredUP.Consts.Color.RED;
        break;
      case PoweredUP.Consts.Color.RED:
        color = PoweredUP.Consts.Color.BLACK;
        break;
    }
    this.topColor = color;
  }

  decreaseTopColor() {
    let color = this._topColor;
    switch (color) {
      case PoweredUP.Consts.Color.BLACK:
        color = PoweredUP.Consts.Color.RED;
        break;
      case PoweredUP.Consts.Color.BLUE:
        color = PoweredUP.Consts.Color.BLACK;
        break;
      case PoweredUP.Consts.Color.CYAN:
        color = PoweredUP.Consts.Color.BLUE;
        break;
      case PoweredUP.Consts.Color.RED:
        color = PoweredUP.Consts.Color.CYAN;
        break;
    }
    this.topColor = color;
  }

  setBottomColorBlack() {
    this.bottomColor = PoweredUP.Consts.Color.BLACK;
  }

  setBottomColorPink() {
    this.bottomColor = PoweredUP.Consts.Color.PINK;
  }

  setBottomColorPurple() {
    this.bottomColor = PoweredUP.Consts.Color.PURPLE;
  }

  setBottomColorBlue() {
    this.bottomColor = PoweredUP.Consts.Color.BLUE;
  }

  setBottomColorLightBlue() {
    this.bottomColor = PoweredUP.Consts.Color.LIGHT_BLUE;
  }

  setBottomColorCyan() {
    this.bottomColor = PoweredUP.Consts.Color.CYAN;
  }

  setBottomColorGreen() {
    this.bottomColor = PoweredUP.Consts.Color.GREEN;
  }

  setBottomColorYellow() {
    this.bottomColor = PoweredUP.Consts.Color.YELLOW;
  }

  setBottomColorOrange() {
    this.bottomColor = PoweredUP.Consts.Color.ORANGE;
  }

  setBottomColorRed() {
    this.bottomColor = PoweredUP.Consts.Color.RED;
  }

  setBottomColorWhite() {
    this.bottomColor = PoweredUP.Consts.Color.WHITE;
  }

  increaseBottomColor() {
    this.bottomColor = this._bottomColor < PoweredUP.Consts.Color.WHITE ? this._bottomColor + 1 : PoweredUP.Consts.Color.BLACK;
  }

  decreaseBottomColor() {
    this.bottomColor = this._bottomColor > PoweredUP.Consts.Color.BLACK ? this._bottomColor - 1 : PoweredUP.Consts.Color.WHITE;
  }

  onButtonDown() {
  }

  onButtonUp() {
  }

  onRemoteButtonDown() {
  }

  onRemoteButtonUp() {
  }

  get name() {
    return this._name;
  }

  get connected() {
    return this._conntected;
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
    if (this._colorDistance) {
      this._distance = 0;
      this._color = 0;
      this._mode = mode;
      this._topColor = PoweredUP.Consts.Color.BLACK;
      this._colorDistance.subscribe(this._mode);
    }
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

  get tilt() {
    return this._tilt;
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

  get rotation() {
    return this._rotation;
  }

  get button() {
    return this._button;
  }

  get remoteButton() {
    return this._remoteButton;
  }

  get current() {
    return this._current;
  }

  get voltage() {
    return this._voltage;
  }

  get maxPower() {
    return this._maxPower;
  }

  set maxPower(maxPower) {
    if (this._bothTracks) {
      this._maxPower = maxPower;
      this._leftTrack.setMaxPower(maxPower);
      this._rightTrack.setMaxPower(maxPower);
      this._bothTracks.setMaxPower(maxPower);
    }
  }

  get accelerate() {
    return this._accelerate;
  }

  set accelerate(state) {
    if (this._bothTracks) {
      this._accelerate = state;
      this._leftTrack.useAccelerationProfile = state;
      this._rightTrack.useAccelerationProfile = state;
      this._bothTracks.useAccelerationProfile = state;
    }
  }

  get accelerationTime() {
    return this._accelerationTime;
  }

  set accelerationTime(time) {
    if (this._bothTracks) {
      this._accelerationTime = time;
      this._leftTrack.setAccelerationTime(time);
      this._rightTrack.setAccelerationTime(time);
      this._bothTracks.setAccelerationTime(time);
    }
  }

  get decelerate() {
    return this._decelerate;
  }

  set decelerate(state) {
    if (this._bothTracks) {
      this._decelerate = state;
      this._leftTrack.useDecelerationProfile = state;
      this._rightTrack.useDecelerationProfile = state;
      this._bothTracks.useDecelerationProfile = state;
    }
  }

  get decelerationTime() {
    return this._decelerationTime;
  }

  set decelerationTime(time) {
    if (this._bothTracks) {
      this._decelerationTime = time;
      this._leftTrack.setDecelerationTime(time);
      this._rightTrack.setDecelerationTime(time);
      this._bothTracks.setDecelerationTime(time);
    }
  }

  update() {
    switch (this.status) {
      case Status.MANUAL:
      case Status.STARTED:
      case Status.STOPPED:
      default:
        break;
      case Status.SCAN:
        // TODO: Distance => STOP
        break;
    }
  }

  loop(fn) {
    setTimeout(() => {
      fn && fn();
    }, 10);
  }
}
