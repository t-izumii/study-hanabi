import * as THREE from "three";

export class Firework {
  #velocity: THREE.Vector3;
  #color: THREE.Color;
  #particleCount: number;
  #upAge: number = 0;
  #upTime: number;
  #explodedTimeAge: number = 0;
  #explodedTime: number;
  #isExploded: boolean = false;
  #points: THREE.Points | null = null;
  #geometry: THREE.BufferGeometry | null = null;
  #material: THREE.ShaderMaterial | null = null;
  #particleVelocities: THREE.Vector3[] = [];
  #scene: THREE.Scene;
  #position: THREE.Vector3;
  #isFinished: boolean = false;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3 = new THREE.Vector3(((Math.random() - 0.5) * 400), 0, ((Math.random() - 0.5) * 100))
  ) {
    this.#scene = scene;
    this.#position = position;

    this.#velocity = new THREE.Vector3(
      0,0,0
    );

    this.#color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.#particleCount = Math.floor(Math.random() * 80) + 300;
    this.#upTime = Math.floor(Math.random() * 10) + 100;
    this.#explodedTime = Math.floor(Math.random() * 10) + 300;

    this.#create();
  }

  /** 初期化処理（ジオメトリ生成・シーン追加など） */
  #create(): void {
    const positions = new Float32Array(this.#particleCount * 3);
    for (let i = 0; i < this.#particleCount; i++) {
      positions[i * 3 + 0] = this.#position.x;
      positions[i * 3 + 1] = this.#position.y;
      positions[i * 3 + 2] = this.#position.z;
    }

    this.#geometry = new THREE.BufferGeometry();
    this.#geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    this.#material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uColor: { value: this.#color },
        uOpacity: { value: 1.0 },
        uPointSize: { value: 3.0 },
      },
      vertexShader: `
        uniform vec3 uColor;
        uniform float uPointSize;
        varying vec3 vColor;
        void main() {
          vColor = uColor;
          gl_PointSize = uPointSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard; // 丸い点にする
          gl_FragColor = vec4(vColor, uOpacity);
        }
      `,
    });

    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#points.position.set = this.#position;
    this.#scene.add(this.#points);
  }

  /** 毎フレーム更新処理（上昇→爆発→減衰→消滅の状態管理） */
  public update(): void {
    if (!this.#points || !this.#geometry) return;

    if (!this.#isExploded) {
      this.#upAge++;
      this.#points.position.y =   this.#upAge ;

      if (this.#upAge > this.#upTime) {
        this.#explode();
      }
    } else {
      // 爆発後の粒子の挙動
      this.#explodedTimeAge++;

      if (this.#material) {
        this.#material.uniforms.uOpacity.value = 1.0 - ( this.#explodedTimeAge  / this.#explodedTime);
        this.#material.uniforms.uPointSize.value = 5.0 - ( this.#explodedTimeAge  / this.#explodedTime) * 5.0;
      }

      // パーティクルの位置を速度ベクトルで更新
      const positions = this.#geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.#particleCount; i++) {
        // 重力の影響を速度に加える
        this.#particleVelocities[i].y -= 0.005;
        
        positions[i * 3 + 0] += this.#particleVelocities[i].x;
        positions[i * 3 + 1] += this.#particleVelocities[i].y;
        positions[i * 3 + 2] += this.#particleVelocities[i].z;
      }
      this.#geometry.attributes.position.needsUpdate = true;

      if ( this.#explodedTimeAge > this.#explodedTime) {
        this.#dispose();
      }
    }
  }

  /** 爆発処理（粒子生成・速度ベクトルの付与など） */
  #explode(): void {
    this.#isExploded = true;

    if (this.#material) {
      this.#material.uniforms.uOpacity.value = 1.0; // 爆発時に一瞬明るく
      this.#material.uniforms.uPointSize.value = 5.0;
    }

    this.#particleVelocities = [];
    for (let i = 0; i < this.#particleCount; i++) {
      // 球面上の均等な分散のための角度生成
      const theta = Math.random() * Math.PI * 2; // 水平角度 (0 to 2π)
      const phi = Math.acos(2 * Math.random() - 1); // 垂直角度 (0 to π)

      // 球面座標から直交座標への変換
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      const direction = new THREE.Vector3(x, y, z);

      direction.normalize().multiplyScalar(Math.random() * 0.04 + 0.2);
      this.#particleVelocities.push(direction);
    }
  }

  /** 後始末処理（シーンから削除・リソース解放） */
  #dispose(): void {
    if (this.#points) this.#scene.remove(this.#points);
    this.#geometry?.dispose();
    this.#material?.dispose();
    this.#isFinished = true;
  }

  /** 終了判定（外部から参照可能） */
  public get isFinished(): boolean {
    return this.#isFinished;
  }
}
