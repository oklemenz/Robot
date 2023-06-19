export default class APIMoveHub {
  constructor(robot) {
    this.robot = robot;
    this.hub = null;
    this.boost = new window.LegoBoost();
  }

  get connected() {
    return !!this.hub;
  }

  async connect() {
    await this.boost.connect();
    this.hub = this.boost.hub;
    if (this.hub) {
      this.observe();
      this.maxPower = 100;
    }
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }
    this.boost.disconnect();
    this.robot._disconnected();
    this.hub = null;
  }

  observe() {
    this.hub.emitter.on("error", (err) => {
      console.error("hub error", err);
    });

    this.hub.emitter.on("connect", () => {
      this.robot._connected();
    });

    this.hub.emitter.on("disconnect", () => {
      this.robot._disconnected();
      this.hub = null;
    });

    /*
    this.hub.emitter.on("current", (device, { current }) => {
      this.robot._setCurrent(current);
    });

    this.hub.emitter.on("voltage", (device, { voltage }) => {
      this.robot._setVoltage(voltage);
    });

    this.hub.emitter.on("batteryLevel", ({ batteryLevel }) => {
      this.robot._setBattery(batteryLevel);
    });
    */

    this.hub.emitter.on("tilt", (tilt) => {
      this.robot._setTilt({
        x: -tilt.roll,
        y: tilt.pitch
      });
    });

    this.hub.emitter.on("color", (color) => {
      this.robot._setColor(color);
    });

    this.hub.emitter.on("distance", (distance) => {
      this.robot._setDistance(distance);
    });

    this.hub.emitter.on("rotation", (degrees) => {
      this.robot._setRotation(degrees);
    });

    /*
    this.hub.emitter.on("button", ({ event }) => {
      this.robot._setButton(event === PoweredUP.Consts.ButtonState.PRESSED);
    });

    this.hub.emitter.on("remoteButton", (device, { event }) => {
      this.robot._setRemoteButton(event === PoweredUP.Consts.ButtonState.PRESSED);
    });
    */
  }

  get name() {
    return "";
  }

  setMaxPower(maxPower = 100) {
    this.maxPower = maxPower;
  }

  setAcceleration(time = 0) {}

  setDeceleration(time = 0) {}

  setSensorMode(mode) {}

  async setSensorColor(color) {}

  async setLEDColor(color) {
    if (!this.connected) {
      return false;
    }
    await this.hub.ledAsync(color);
    return true;
  }

  async rotateHead(rotation, speed) {
    if (!this.connected) {
      return false;
    }
    await this.hub.motorAngleAsync("C", rotation, speed, false);
    return true;
  }

  async move(speedLeft, speedRight, time) {
    if (!this.connected) {
      return false;
    }
    await this.hub.motorTimeMultiAsync(
      time || 5,
      (speedLeft / 100) * this.maxPower,
      (speedRight / 100) * this.maxPower,
      false
    );
    return true;
  }

  async turn(degrees, speed) {
    if (!this.connected) {
      return false;
    }
    // TODO: Set Speed + Max Power (=> turnSpeed)
    await this.hub.turn(degrees);
    return true;
  }

  async stop() {
    if (!this.connected) {
      return false;
    }
    await this.hub.motorTimeMultiAsync(0, 0, 0, false);
    return true;
  }
}
