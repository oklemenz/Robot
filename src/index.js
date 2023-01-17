import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { TWEEN } from "Tween";

import Sandbox from "sandbox";
import GUI from "gui";
import Robot from "robot";
import RobotViz from "robotViz";
import Control from "control";

init();

export function init() {
  const container = document.getElementById("container");

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const width = window.innerWidth;
  const height = window.innerHeight;
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 5000);
  // make the camera look down
  camera.position.set(0, 80, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
  window.camera = camera;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = true;
  controls.enableDamping = true;

  const light = new THREE.AmbientLight(0xfff0dd, 1);
  scene.add(light);

  const robot = new Robot();
  scene.add(new Sandbox());
  scene.add(new RobotViz(robot));
  new GUI(robot);
  const virtualJoyStick = new JoyStick("joystick", {
    internalFillColor: "#555555",
    internalStrokeColor: "#000000",
    externalStrokeColor: "#000000",
  });
  const control = new Control(robot, virtualJoyStick);

  render();

  function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
  }

  function update() {
    TWEEN.update();
    controls.update();
    control.update();
    robot.update();
  }

  window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
}
