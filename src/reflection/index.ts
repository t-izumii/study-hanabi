import * as THREE from "three";
import reflectionVertexShader from "./glsl/reflectionVertex.glsl";
import reflectionFragmentShader from "./glsl/reflectionFragment.glsl";

export class Reflection {
  #scene: THREE.Scene;
  #mesh: THREE.Mesh | null = null;
  #texture: THREE.Texture;
  #material: THREE.ShaderMaterial | null = null;

  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    this.#scene = scene;
    this.#texture = texture;
    this.#init();
  }

  #init() {
    this.#create();
  }

  #create() {
    const geometry = new THREE.PlaneGeometry(2000, 360);

    // テクスチャの設定
    this.#texture.wrapS = THREE.ClampToEdgeWrapping;
    this.#texture.wrapT = THREE.ClampToEdgeWrapping;
    this.#texture.minFilter = THREE.LinearFilter;
    this.#texture.magFilter = THREE.LinearFilter;

    // カスタムシェーダーマテリアルを作成
    this.#material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.#texture },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uTime: { value: 0.0 },
        uOpacity: { value: 0.8 },
        uTextureOffset: { value: new THREE.Vector2(0.0, 0.0) }, // テクスチャオフセット
        uTextureScale: { value: new THREE.Vector2(1.0, 1.0) },   // テクスチャスケール
      },
      vertexShader: reflectionVertexShader,
      fragmentShader: reflectionFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.#mesh = new THREE.Mesh(geometry, this.#material);
    this.#mesh.position.z = -499;
    this.#mesh.position.y = -350;
    this.#scene.add(this.#mesh);
  }

  // 時間を更新（アニメーション用）
  public updateTime(time: number): void {
    if (this.#material) {
      this.#material.uniforms.uTime.value = time;
    }
  }

  // 解像度を更新（ウィンドウリサイズ対応）
  public updateResolution(width: number, height: number): void {
    if (this.#material) {
      this.#material.uniforms.uResolution.value.set(width, height);
    }
  }

  // テクスチャのオフセット位置を設定
  public setTextureOffset(x: number, y: number): void {
    if (this.#material) {
      this.#material.uniforms.uTextureOffset.value.set(x, y);
    }
  }

  // テクスチャのスケールを設定
  public setTextureScale(x: number, y: number): void {
    if (this.#material) {
      this.#material.uniforms.uTextureScale.value.set(x, y);
    }
  }

  // 外部からmeshにアクセスするためのgetter
  public get mesh(): THREE.Mesh | null {
    return this.#mesh;
  }

  dispose() {
    if (this.#mesh) {
      this.#scene.remove(this.#mesh);
      this.#mesh.geometry.dispose();
      if (this.#material) {
        this.#material.dispose();
      }
    }
  }
}
