import * as THREE from "three";

export class Firework {
  #velocity: THREE.Vector3;
  #color: THREE.Color;
  #particleCount: number;
  #lifespan: number;
  #age: number = 0;
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
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  ) {
    this.#scene = scene;
    this.#position = position;

    this.#velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3, // x方向ランダムを弱めに
      Math.random() * 0.8 + 1.2, // y方向はより強めに上昇
      (Math.random() - 0.5) * 0.3 // z方向ランダムを弱めに
    );

    this.#color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.#particleCount = Math.floor(Math.random() * 80) + 300; // 50〜130個
    this.#lifespan = Math.floor(Math.random() * 100) + 10; // 150〜250フレームに延長

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
    this.#scene.add(this.#points);
  }

  /** 毎フレーム更新処理（上昇→爆発→減衰→消滅の状態管理） */
  public update(): void {
    if (!this.#points || !this.#geometry) return;

    this.#age++;

    if (!this.#isExploded) {
      // 打ち上げ演出（尾を引きながら点滅）
      if (this.#material) {
        this.#material.uniforms.uOpacity.value =
          0.7 + Math.sin(this.#age * 0.25) * 0.3;
        this.#material.uniforms.uPointSize.value =
          3.0 + Math.sin(this.#age * 0.3) * 1.5;
      }

      // 上昇処理
      this.#position.add(this.#velocity);
      this.#velocity.y -= 0.004; // 重力減速

      const positions = this.#geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < this.#particleCount; i++) {
        positions.setXYZ(
          i,
          this.#position.x,
          this.#position.y,
          this.#position.z
        );
      }
      positions.needsUpdate = true;

      if (this.#velocity.y <= 0 || this.#age > this.#lifespan / 2) {
        this.#explode();
      }
    } else {
      // 爆発後の粒子の挙動
      if (this.#material) {
        this.#material.uniforms.uOpacity.value *= 0.97; // 徐々にフェードアウト
        this.#material.uniforms.uPointSize.value *= 0.98; // 粒子サイズも縮小
      }

      const positions = this.#geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < this.#particleCount; i++) {
        const vel = this.#particleVelocities[i];
        vel.y -= 0.0025; // 重力

        const x = positions.getX(i) + vel.x;
        const y = positions.getY(i) + vel.y;
        const z = positions.getZ(i) + vel.z;
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;

      if (this.#age > this.#lifespan) {
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
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2
      );
      direction.normalize().multiplyScalar(Math.random() * 1.2 + 0.4);
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
