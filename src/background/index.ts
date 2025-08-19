import * as THREE from "three";

export class BgPlane {
  #scene: THREE.Scene;
  #mesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
    this.#init();
  }

  #init() {
    this.#create();
  }

  #create() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("src/background/bg.png");

    const geometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
    });

    this.#mesh = new THREE.Mesh(geometry, material);
    this.#mesh.position.z = -500;
    this.#scene.add(this.#mesh);
  }

  dispose() {
    if (this.#mesh) {
      this.#scene.remove(this.#mesh);
      this.#mesh.geometry.dispose();
      (this.#mesh.material as THREE.Material).dispose();
    }
  }
}
