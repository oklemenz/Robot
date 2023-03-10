import { GUI as LilGUI } from "lilgui";

export default class GUI extends LilGUI {
  constructor(robot) {
    super({ container: document.getElementById("gui") });
    this.link(robot);
    this.setup();
  }

  link(robot) {
    this.robot = robot;
    this.robot.hud = this;
  }

  setup() {
    this.title("Robot");
    const info = this.addFolder("Info");
    info.add(this.robot, "name").listen().disable();
    info.add(this.robot, "connected").listen().disable();
    info.add(this.robot, "status", this.robot.const.Status.ui()).listen().disable();
    info.open();
    const connect = this.addFolder("Connect");
    this.apiVersion = connect.add(this.robot, "apiVersion", this.robot.const.APIVersion.ui()).name("api version");
    this.connectButton = connect.add(this.robot, "connect");
    this.disconnectButton = connect.add(this.robot, "disconnect").disable();
    connect.open();
    const control = this.addFolder("Control");
    const manual = control.addFolder("Manual");
    this.controlModeButton = manual
      .add(this.robot, "controlMode", this.robot.const.ControlMode.ui())
      .name("gamepad")
      .listen()
      .disable();
    const action = manual.addFolder("Action");
    this.shootButton = action.add(this.robot, "shoot").disable();
    action.open();
    const look = manual.addFolder("Look");
    this.lookCenterButton = look.add(this.robot, "lookCenter").name("look center").disable();
    this.lookLeftButton = look.add(this.robot, "lookLeft").name("look left").disable();
    this.lookRightButton = look.add(this.robot, "lookRight").name("look right").disable();
    look.open();
    const turn = manual.addFolder("Turn");
    this.turnLeftButton = turn.add(this.robot, "manualTurnLeft").name("turn left").disable();
    this.turnRightButton = turn.add(this.robot, "manualTurnRight").name("turn right").disable();
    this.turnAroundButton = turn.add(this.robot, "manualTurnAround").name("turn around").disable();
    this.turnFullButton = turn.add(this.robot, "manualTurnFull").name("turn full").disable();
    turn.open();
    const move = manual.addFolder("Move");
    this.moveUntilButton = move.add(this.robot, "manualMoveUntil").name("move until").disable();
    move.open();
    manual.open();
    const auto = control.addFolder("Auto");
    this.startButton = auto.add(this.robot, "start").disable();
    this.stopButton = auto.add(this.robot, "stop").disable();
    auto.open();
    const settings = this.addFolder("Settings");
    this.modeButton = settings.add(this.robot, "mode", this.robot.const.Mode.ui()).listen().disable();
    this.topColorButton = settings
      .add(this.robot, "topColor", this.robot.const.TopColor.ui())
      .name("top light")
      .listen()
      .disable();
    this.bottomColorButton = settings
      .add(this.robot, "bottomColor", this.robot.const.Color.ui())
      .name("bottom light")
      .listen()
      .disable();
    settings.open();
    const movement = settings.addFolder("Movement");
    this.maxPower = movement.add(this.robot, "maxPower", 0, 100).name("max power").disable();
    this.friction = movement.add(this.robot, "friction", 0, 2).disable();
    this.acceleration = movement.add(this.robot, "acceleration", 0, 2000).disable();
    this.deceleration = movement.add(this.robot, "deceleration", 0, 2000).disable();
    movement.open();
    control.open();
    const sensors = this.addFolder("Sensors");
    sensors.addColor(this.robot, "hexColor").name("color").disable();
    sensors.add(this.robot, "battery", 0, 100, 1).listen().disable();
    sensors.add(this.robot, "distance", 0, 250, 1).listen().disable();
    sensors.add(this.robot, "rotation", -90, 90, 1).listen().disable();
    sensors.add(this.robot, "headOrientation", this.robot.const.HeadOrientation.ui()).name("looks").listen().disable();
    const tilt = sensors.addFolder("Tilt");
    tilt.add(this.robot.tilt, "x", -90, 90, 1).listen().disable();
    tilt.add(this.robot.tilt, "y", -90, 90, 1).listen().disable();
    tilt
      .add(this.robot, "bodyOrientation", this.robot.const.BodyOrientation.ui())
      .name("orientation")
      .listen()
      .disable();
    tilt.open();
    sensors.add(this.robot, "button").listen().disable();
    sensors.add(this.robot, "remoteButton").name("remote button").listen().disable();
    sensors.add(this.robot, "current", 0, 1000, 1).decimals(2).listen().disable();
    sensors.add(this.robot, "voltage", 0, 10, 1).decimals(2).listen().disable();
    sensors.open();
    const lights = this.addFolder("Lights");
    lights.addColor(this.robot, "hexTopColor").name("top").listen().disable();
    lights.addColor(this.robot, "hexBottomColor").name("bottom").listen().disable();
    lights.addColor(this.robot, "hexBatteryColor").name("battery").listen().disable();
    lights.open();
  }
}
