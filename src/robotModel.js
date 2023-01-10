const Mode = {
  COLOR: 0x00,
  DISTANCE: 0x01,
  LED: 0x05,
  COLOR_AND_DISTANCE: 0x08
};

const Status = {
  MANUAL: 0,
  STARTED: 1,
  STOPPED: 2
};

const Colors = {
  [PoweredUP.Consts.Color.BLACK]: "#000000",
  [PoweredUP.Consts.Color.PINK]: "#FF70F4",
  [PoweredUP.Consts.Color.PURPLE]: "#D870FF",
  [PoweredUP.Consts.Color.BLUE]: "#477DE9",
  [PoweredUP.Consts.Color.LIGHT_BLUE]: "#47B5E9",
  [PoweredUP.Consts.Color.CYAN]: "#47DFE9",
  [PoweredUP.Consts.Color.GREEN]: "#53E947",
  [PoweredUP.Consts.Color.YELLOW]: "#FBFB58",
  [PoweredUP.Consts.Color.ORANGE]: "#FBB658",
  [PoweredUP.Consts.Color.RED]: "#FB6458",
  [PoweredUP.Consts.Color.WHITE]: "#FFFFFF"
};

const Constants = {
  TRACK_MAX_POWER: 50,
  HEAD_TURN_SPEED: 100,
  HEAD_TURN_ANGLE: 45
};

// TODO:
//  - Drive with Controller
//    - Single Axis drive (toggle mode in UI)
//  - Scan (rotate 360, record distances)
//  - Build up map, record/invalidate blocks, update position on map
//  - AI: Forwards, Stop, Backwards, Rotate Left, Rotate right, Look Left, Look Right

export default class RobotModel {
  constructor() {
    this._init();
  }

  _init() {
    this._name = "";
    this._conntected = false;
    this._status = Status.MANUAL;
    this._mode = Mode.DISTANCE;
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
            console.log(`Device ${device.typeName} attached to port ${device.portName}`);
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
    console.log(`Connected to ${hub.name}!`);

    this.gui.startButton.enable();
    this.gui.stopButton.disable();
    this.gui.shootButton.enable();
    this.gui.topColorButton.enable();
    this.gui.bottomColorButton.enable();
    this.gui.modeButton.enable();
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
    this.gui.topColorButton.disable();
    this.gui.bottomColorButton.disable();
    this.gui.modeButton.disable();
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

    // Default
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
      this._battery = batteryLevel;
      // TODO: Emit: 20%, 10%, 5%
    });

    this._hub.on("tilt", (device, { x, y }) => {
      this._tilt.x = x;
      this._tilt.y = y;
      // TODO: Emit: lean/fall forwards, backwards, left, right
    });

    this._hub.on("color", (device, { color }) => {
      this._color = color;
      // TODO: Emit: Red detected...
    });

    this._hub.on("colorAndDistance", (device, { color, distance }) => {
      this._color = color;
      this._distance = distance;
      // TODO: Emit: < 20 cm, 10 cm, 5 cm
    });

    this._hub.on("distance", (device, { distance }) => {
      this._distance = distance;
      // TODO: Emit: < 20 cm, 10 cm, 5 cm
    });

    this._hub.on("rotate", (device, { degrees }) => {
      this._rotation = degrees;
      // TODO: Emit: Look Left, Look Right, Look Center
    });

    this._hub.on("button", ({ event }) => {
      this._button = event === PoweredUP.Consts.ButtonState.PRESSED;
      if (this._button) {
        this.onButtonDown();
      } else {
        this.onButtonUp();
      }
    });

    this._hub.on("remoteButton", (device, { event }) => {
      this._remoteButton = event === PoweredUP.Consts.ButtonState.PRESSED;
      // TODO: Emit: down, up
    });
  }

  manual() {
    this._status = Status.MANUAL;
  }

  start() {
    this._status = Status.STARTED;

    this.gui.startButton.disable();
    this.gui.stopButton.enable();
  }

  stop() {
    this._status = Status.STOPPED;

    this.gui.startButton.enable();
    this.gui.stopButton.disable();
  }

  async shoot() {
    if (this._head) {
      await this.lookCenter();
      await this._head.rotateByDegrees(90, Constants.HEAD_TURN_SPEED);
      await this._head.rotateByDegrees(85, Constants.HEAD_TURN_SPEED);
    }
  }

  async lookCenter() {
    if (this._head) {
      const degrees = Math.abs(this.rotation);
      const speed = Constants.HEAD_TURN_SPEED * this.rotation > 0 ? -1 : 1;
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async lookRight() {
    if (this._head) {
      const rotation = Constants.HEAD_TURN_ANGLE - this.rotation;
      const degrees = Math.abs(rotation);
      const speed = Constants.HEAD_TURN_SPEED * rotation > 0 ? 1 : -1;
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async lookLeft() {
    if (this._head) {
      const rotation = this.rotation - Constants.HEAD_TURN_ANGLE;
      const degrees = Math.abs(rotation);
      const speed = Constants.HEAD_TURN_SPEED * rotation > 0 ? 1 : -1;
      await this._head.rotateByDegrees(degrees, speed);
    }
  }

  async moveLeftTrack(speed) {
    if (this._leftTrack) {
      await this._leftTrack.setSpeed(speed);
    }
  }

  async moveRightTrack(speed) {
    if (this._rightTrack) {
      await this._rightTrack.setSpeed(speed);
    }
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

  setTopColorBlack() {
    this.setTopColor(PoweredUP.Consts.Color.BLACK);
  }

  setTopColorBlue() {
    this.setTopColor(PoweredUP.Consts.Color.BLUE);
  }

  setTopColorGreen() {
    this.setTopColor(PoweredUP.Consts.Color.CYAN);
  }

  setTopColorRed() {
    this.setTopColor(PoweredUP.Consts.Color.RED);
  }

  setTopColor(color) {
    if (this._colorDistance) {
      this.setModeLED();
      this._topColor = color;
      this._colorDistance.setColor(color);
    }
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
    this.setTopColor(color);
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
    this.setTopColor(color);
  }

  setBottomColorBlack() {
    this.setBottomColor(PoweredUP.Consts.Color.BLACK);
  }

  setBottomColorPink() {
    this.setBottomColor(PoweredUP.Consts.Color.PINK);
  }

  setBottomColorPurple() {
    this.setBottomColor(PoweredUP.Consts.Color.PURPLE);
  }

  setBottomColorBlue() {
    this.setBottomColor(PoweredUP.Consts.Color.BLUE);
  }

  setBottomColorLightBlue() {
    this.setBottomColor(PoweredUP.Consts.Color.LIGHT_BLUE);
  }

  setBottomColorCyan() {
    this.setBottomColor(PoweredUP.Consts.Color.CYAN);
  }

  setBottomColorGreen() {
    this.setBottomColor(PoweredUP.Consts.Color.GREEN);
  }

  setBottomColorYellow() {
    this.setBottomColor(PoweredUP.Consts.Color.YELLOW);
  }

  setBottomColorOrange() {
    this.setBottomColor(PoweredUP.Consts.Color.ORANGE);
  }

  setBottomColorRed() {
    this.setBottomColor(PoweredUP.Consts.Color.RED);
  }

  setBottomColorWhite() {
    this.setBottomColor(PoweredUP.Consts.Color.WHITE);
  }

  setBottomColor(color) {
    if (this._led) {
      this._bottomColor = color;
      this._led.setColor(color);
    }
  }

  increaseBottomColor() {
    this.setBottomColor(
      this._bottomColor < PoweredUP.Consts.Color.WHITE ? this._bottomColor + 1 : PoweredUP.Consts.Color.BLACK
    );
  }

  decreaseBottomColor() {
    this.setBottomColor(
      this._bottomColor > PoweredUP.Consts.Color.BLACK ? this._bottomColor - 1 : PoweredUP.Consts.Color.WHITE
    );
  }

  onButtonDown() {}

  onButtonUp() {}

  get name() {
    return this._name;
  }

  get connected() {
    return this._conntected;
  }

  get status() {
    return this._status;
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

  get battery() {
    return this._battery;
  }

  get tilt() {
    return this._tilt;
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

  get "remote button"() {
    return this._remoteButton;
  }

  get current() {
    return this._current;
  }

  get voltage() {
    return this._voltage;
  }

  get "top light"() {
    return this._topColor;
  }

  set "top light"(color) {
    this.setTopColor(color);
  }

  get "bottom light"() {
    return this._bottomColor;
  }

  set "bottom light"(color) {
    this.setBottomColor(color);
  }

  get color() {
    return Colors[this._color];
  }

  get "top color"() {
    return Colors[this._topColor];
  }

  get "bottom color"() {
    return Colors[this._bottomColor];
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

  loop(fn) {
    setTimeout(() => {
      fn && fn();
    }, 10);
  }
}
