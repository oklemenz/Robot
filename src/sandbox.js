import * as THREE from "three";

export default class Sandbox extends THREE.Group {
  constructor() {
    super();
    this.size = 200;
    this.divisions = 40;
    this.add(this.createFloor());
    this.add(this.createGrid());
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.size, this.size);
    const floorTexture = new THREE.TextureLoader().load("textures/wood.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 5);
    const floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture });
    floorMaterial.transparent = true;
    floorMaterial.opacity = 0.5;
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.material.side = THREE.DoubleSide;
    floor.rotation.x = -Math.PI / 2;
    floor.rotation.y = 0;
    floor.rotation.z = Math.PI / 2;
    floor.position.x = 2.5;
    floor.position.y = 0;
    floor.position.z = 2.5;
    return floor;
  }

  createGrid() {
    const cells = this.size / this.divisions;
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const points = [];
    points.push(new THREE.Vector3(-this.size / 2, 0, -this.size / 2));
    let sign = 1;
    for (let i = 0; i <= this.divisions; i++) {
      points.push(new THREE.Vector3((sign * this.size) / 2, 0, -this.size / 2 + i * cells));
      if (i < this.divisions) {
        points.push(new THREE.Vector3((sign * this.size) / 2, 0, -this.size / 2 + (i + 1) * cells));
      }
      sign *= -1;
    }
    sign = -1;
    for (let i = 0; i <= this.divisions; i++) {
      points.push(new THREE.Vector3(this.size / 2 - i * cells, 0, (sign * this.size) / 2));
      if (i < this.divisions) {
        points.push(new THREE.Vector3(this.size / 2 - (i + 1) * cells, 0, (sign * this.size) / 2));
      }
      sign *= -1;
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const grid = new THREE.Line(geometry, material);
    grid.position.x = 2.5;
    grid.position.y = 0;
    grid.position.z = 2.5;
    return grid;
  }
}
