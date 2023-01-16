import { GUI as LilGUI } from "lilgui";

export default class GUI extends LilGUI {
  constructor(model) {
    super({ container: document.getElementById("gui") });

    this._model = model;
    this._model.gui = this;

    this.title("Robot");
    const info = this.addFolder("Info");
    info.add(model, "name").listen().disable();
    info.add(model, "connected").listen().disable();
    info.add(model, "status", {
      manual: 0,
      started: 1,
      scan: 2,
      stopped: 99
    }).listen().disable();
    info.open();
    const actions = this.addFolder("Actions");
    actions.add(model, "connect");
    this.startButton = actions.add(model, "start").disable();
    this.stopButton = actions.add(model, "stop").disable();
    this.shootButton = actions.add(model, "shoot").disable();
    this.lookCenterButton = actions.add(model, "lookCenter").name("look center").disable();
    this.lookLeftButton = actions.add(model, "lookLeft").name("look left").disable();
    this.lookRightButton = actions.add(model, "lookRight").name("look right").disable();
    this.modeButton = actions
      .add(model, "mode", {
        color: 0x00,
        distance: 0x01,
        led: 0x05,
        "color & distance": 0x08
      })
      .listen()
      .disable();
    this.controlModeButton = actions
      .add(model, "controlMode", {
        "single stick": 0,
        "double stick": 1,
      })
      .name("control mode")
      .listen()
      .disable();
    this.topColorButton = actions
      .add(model, "topColor", {
        off: 0,
        blue: 3,
        green: 5,
        red: 9
      })
      .name("top light")
      .listen()
      .disable();
    this.bottomColorButton = actions
      .add(model, "bottomColor", {
        off: 0,
        pink: 1,
        purple: 2,
        blue: 3,
        light_blue: 4,
        cyan: 5,
        green: 6,
        yellow: 7,
        orange: 8,
        red: 9,
        white: 10
      })
      .name("bottom light")
      .listen()
      .disable();
    const move = actions.addFolder("Move");
    this.maxPower = move.add(model, "maxPower", 0, 100).name("max power").disable();
    this.accelerate = move.add(model, "accelerate").disable();
    this.accelerationTime = move.add(model, "accelerationTime", 0, 2000).name("acceleration time").disable();
    this.decelerate = move.add(model, "decelerate").disable();
    this.decelerationTime = move.add(model, "decelerationTime", 0, 2000).name("deceleration time").disable();
    move.open();
    actions.open();
    const sensors = this.addFolder("Sensors");
    sensors.addColor(model, "hexColor").name("color").disable();
    sensors.add(model, "battery", 0, 100, 1).listen().disable();
    sensors.add(model, "distance", 0, 250, 1).listen().disable();
    sensors.add(model, "rotation", -90, 90, 1).listen().disable();
    sensors.add(model, "headOrientation", {
      center: 0,
      left: 1,
      right: 2,
    }).name("looks").listen().disable();
    const tilt = sensors.addFolder("Tilt");
    tilt.add(model.tilt, "x", -90, 90, 1).listen().disable();
    tilt.add(model.tilt, "y", -90, 90, 1).listen().disable();
    tilt.add(model, "bodyOrientation", {
      unknown: 0,
      up: 1,
      "upside down": 2,
      front: 3,
      back: 4,
      left: 5,
      right: 6,
      "lean front": 7,
      "lean back": 8,
      "lean left": 9,
      "lean right": 10,
    }).name("orientation").listen().disable();
    tilt.open();
    sensors.add(model, "button").listen().disable();
    sensors.add(model, "remoteButton").name("remote button").listen().disable();
    sensors.add(model, "current", 0, 1000, 1).decimals(2).listen().disable();
    sensors.add(model, "voltage", 0, 10, 1).decimals(2).listen().disable();
    sensors.open();
    const lights = this.addFolder("Lights");
    lights.addColor(model, "hexTopColor").name("top color").listen().disable();
    lights.addColor(model, "hexBottomColor").name("bottom color").listen().disable();
    lights.open();
  }
}
