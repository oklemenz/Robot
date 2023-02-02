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
    this.maxPopwer = 100;
    await this.robot._connected();
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }
    this.boost.disconnect();
    this.hub = null;
    this.robot._disconnected();
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
      time,
      (speedLeft / 100) * this.maxPower,
      (speedRight / 100) * this.maxPower,
      false
    );
    return true;
  }

  async turn(speed, time) {
    if (!this.connected) {
      return false;
    }
    await this.hub.motorTimeMultiAsync(time, (speed / 100) * this.maxPower, (-speed / 100) * this.maxPower, false);
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
