export default class APIPoweredUP {
  constructor(robot) {
    this.robot = robot;
    this.hub = null;
    this.maxPower = 100;
  }

  get connected() {
    return !!this.hub;
  }

  async connect() {
    if (this.connected) {
      return;
    }
    await new Promise((resolve, reject) => {
      try {
        const poweredUP = new window.PoweredUP.PoweredUP();
        poweredUP.on("discover", async (hub) => {
          hub.on("attach", (device) => {
            console.log(
              `Device ${device.typeName || device.type} attached to port ${device.portName || device.portId}`
            );
          });
          hub.on("disconnect", () => {
            this.robot._disconnected();
          });
          this.hub = hub;
          await hub.connect();
          await this.mount();
          await this.observe();
          await this.robot._connected();
          resolve();
        });
        poweredUP.scan();
        console.log("Scanning...");
      } catch (err) {
        reject(err);
      }
    });
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }
    await this.hub.disconnect();
    this.hub = null;
  }

  async mount() {
    this.leftTrack = await this.hub.waitForDeviceAtPort("A");
    this.rightTrack = await this.hub.waitForDeviceAtPort("B");
    this.bothTracks = await this.hub.waitForDeviceAtPort("AB");
    this.head = await this.hub.waitForDeviceAtPort("D");
    this.colorDistance = await this.hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR); // C
    this.led = await this.hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
  }

  observe() {
    this.hub.on("current", (device, { current }) => {
      this.robot._setCurrent(current);
    });

    this.hub.on("voltage", (device, { voltage }) => {
      this.robot._setVoltage(voltage);
    });

    this.hub.on("batteryLevel", ({ batteryLevel }) => {
      this.robot._setBattery(batteryLevel);
    });

    this.hub.on("tilt", (device, tilt) => {
      this.robot._setTilt(tilt);
    });

    this.hub.on("color", (device, { color }) => {
      this.robot._setColor(color);
    });

    this.hub.on("colorAndDistance", (device, { color, distance }) => {
      this.robot._setColor(color);
      this.robot._setDistance(distance);
    });

    this.hub.on("distance", (device, { distance }) => {
      this.robot._setDistance(distance);
    });

    this.hub.on("rotate", (device, { degrees }) => {
      if (device === this.head) {
        this.robot._setRotation(degrees);
      }
    });

    this.hub.on("button", ({ event }) => {
      this.robot._setButton(event === PoweredUP.Consts.ButtonState.PRESSED);
    });

    this.hub.on("remoteButton", (device, { event }) => {
      this.robot._setRemoteButton(event === PoweredUP.Consts.ButtonState.PRESSED);
    });
  }

  get name() {
    if (!this.connected) {
      return "";
    }
    return this.hub.name;
  }

  setMaxPower(maxPower = 100) {
    if (!this.connected) {
      return false;
    }
    this.maxPower = maxPower;
    this.leftTrack.setMaxPower(maxPower);
    this.rightTrack.setMaxPower(maxPower);
    this.bothTracks.setMaxPower(maxPower);
    return true;
  }

  setAcceleration(time = 0) {
    if (!this.connected) {
      return false;
    }
    this.leftTrack.useAccelerationProfile = time !== 0;
    this.leftTrack.setAccelerationTime(time);
    this.rightTrack.useAccelerationProfile = time !== 0;
    this.rightTrack.setAccelerationTime(time);
    this.bothTracks.useAccelerationProfile = time !== 0;
    this.bothTracks.setAccelerationTime(time);
    return true;
  }

  setDeceleration(time = 0) {
    if (!this.connected) {
      return false;
    }
    this.leftTrack.useDecelerationProfile = time !== 0;
    this.leftTrack.setDecelerationTime(time);
    this.rightTrack.useDecelerationProfile = time !== 0;
    this.rightTrack.setDecelerationTime(time);
    this.bothTracks.useDecelerationProfile = time !== 0;
    this.bothTracks.setDecelerationTime(time);
    return true;
  }

  setSensorMode(mode) {
    if (!this.connected) {
      return false;
    }
    this.colorDistance.subscribe(mode);
    return true;
  }

  async setSensorColor(color) {
    if (!this.connected) {
      return false;
    }
    await this.colorDistance.setColor(color);
    return true;
  }

  async setLEDColor(color) {
    if (!this.connected) {
      return false;
    }
    await this.led.setColor(color);
    return true;
  }

  async rotateHead(rotation, speed) {
    if (!this.connected) {
      return false;
    }
    await this.head.rotateByDegrees(Math.abs(rotation), speed * (rotation > 0 ? 1 : -1));
    return true;
  }

  async move(speedLeft, speedRight, time) {
    if (!this.connected) {
      return false;
    }
    await this.bothTracks.setSpeed([(speedLeft / 100) * this.maxPower, (speedRight / 100) * this.maxPower], time);
    return true;
  }

  async turn(speed, time) {
    if (!this.connected) {
      return false;
    }
    this.leftTrack.setSpeed((speed / 100) * this.maxPower, time);
    this.rightTrack.setSpeed((-speed / 100) * this.maxPower, time);
    return true;
  }

  async stop() {
    if (!this.connected) {
      return false;
    }
    await this.bothTracks.setSpeed(0, 0);
    return true;
  }
}
