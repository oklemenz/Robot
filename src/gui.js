import { GUI as LilGUI } from "lilgui";

export default class GUI extends LilGUI {
  constructor(model) {
    super({ container: document.getElementById("gui") });
    this._model = model;
    this.add(model, "name").listen().disable();
    this.add(model, "connected").listen().disable();
    this.add(model, "status", {
      manual: 0,
      started: 1,
      stopped: 2
    }).disable();
    const actions = this.addFolder("Actions");
    actions.add(model, "connect");
    this.startButton = actions.add(model, "start").disable();
    this.stopButton = actions.add(model, "stop").disable();
    this.shootButton = actions.add(model, "shoot").disable();
    this.modeButton = actions
      .add(model, "mode", {
        color: 0x00,
        distance: 0x01,
        led: 0x05,
        "color & distance": 0x08
      })
      .listen()
      .disable();
    this.topColorButton = actions
      .add(model, "top light", {
        off: 0,
        blue: 3,
        green: 5,
        red: 9
      })
      .listen()
      .disable();
    this.bottomColorButton = actions
      .add(model, "bottom light", {
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
      .listen()
      .disable();
    const move = actions.addFolder("Move");
    this.maxPower = move.add(model, "maxPower").disable();
    this.accelerate = move.add(model, "accelerate").disable();
    this.accelerationTime = move.add(model, "accelerationTime", 0, 2000).disable();
    this.decelerate = move.add(model, "decelerate").disable();
    this.decelerationTime = move.add(model, "decelerationTime", 0, 2000).disable();
    move.open();
    actions.open();
    const sensors = this.addFolder("Sensors");
    sensors.add(model, "battery", 0, 100, 1).listen().disable();
    sensors.add(model, "distance", 0, 250, 1).listen().disable();
    sensors.add(model, "rotation", -90, 90, 1).listen().disable();
    sensors.addColor(model, "color").disable();
    const tilt = sensors.addFolder("Tilt");
    tilt.add(model.tilt, "x", -90, 90, 1).listen().disable();
    tilt.add(model.tilt, "y", -90, 90, 1).listen().disable();
    tilt.open();
    sensors.add(model, "button").listen().disable();
    sensors.add(model, "remote button").listen().disable();
    sensors.add(model, "current", 0, 1000, 1).listen().disable();
    sensors.add(model, "voltage", 0, 10, 1).listen().disable();
    sensors.open();
    const lights = this.addFolder("Lights");
    lights.addColor(model, "top color").listen().disable();
    lights.addColor(model, "bottom color").listen().disable();
    lights.open();
    model.gui = this;
  }
}
