export default class APIMoveHub {

  constructor(robot) {
    this.robot = robot;
    this.hub = null;
  }

  get connected() {
    return !!this.hub;
  }

  async connect() {
  }

  async mount() {
  }

  async observe() {
  }

  setMaxPower(power = 50) {
  }

  setAcceleration(time = 0) {
  }

  setDeceleration(time = 0) {
  }

}