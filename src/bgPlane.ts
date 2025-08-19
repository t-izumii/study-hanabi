import * as THREE from "three";

export class bgPlane {
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
    // テクスチャを読み込み
    const loader = new THREE.TextureLoader();
    
    // 成功・失敗のコールバックを追加してデバッグ
    const texture = loader.load('/src/bg.png');

    // 大きなプレーンジオメトリを作成（画面全体をカバー）
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
    });

    this.#mesh = new THREE.Mesh(geometry, material);
    this.#mesh.position.z = -500; // 背景として後ろに配置
    this.#scene.add(this.#mesh);
    
    console.log('背景プレーン作成完了:', this.#mesh);
  }

  dispose() {
    if (this.#mesh) {
      this.#scene.remove(this.#mesh);
      this.#mesh.geometry.dispose();
      (this.#mesh.material as THREE.Material).dispose();
    }
  }
}