import * as THREE from "three";

export default class RobotViz extends THREE.Group {

  constructor(robot) {
    super();
    this.link(robot);
    this.width = 3;
    this.height = 1;
    this.length = 2;
    this.add(this.createRobot());
  }

  link(robot) {
    this.robot = robot;
    robot.viz = this;
  }

  createRobot() {
    const height = 1;
    const robotGeometry = new THREE.BoxGeometry(this.width, this.height, this.length);
    const robotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const robot = new THREE.Mesh(robotGeometry, robotMaterial);
    robot.position.set(0, height / 2, 0);
    return robot;
  }
}
