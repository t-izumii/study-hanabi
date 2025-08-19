import * as THREE from "three";
import fragmentShader from "../glsl/fragmentShader.glsl";
import vertexShader from "../glsl/vertexShader.glsl";
import { PHYSICS, PARTICLE, TIMING, POSITION, RENDERING } from "../constants";
import { FireworkState } from "../types";

export class Firework {
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
  #positionsArray: Float32Array | null = null;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3 = new THREE.Vector3(
      (Math.random() - 0.5) * POSITION.X_RANGE,
      POSITION.Y_START,
      (Math.random() - 0.5) * POSITION.Z_RANGE
    )
  ) {
    this.#scene = scene;
    this.#position = position;
    this.#color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.#particleCount =
      Math.floor(Math.random() * PARTICLE.COUNT_RANGE) + PARTICLE.COUNT_BASE;
    this.#upTime =
      Math.floor(Math.random() * TIMING.UP_TIME_RANGE) + TIMING.UP_TIME_BASE;
    this.#explodedTime =
      Math.floor(Math.random() * TIMING.EXPLODED_TIME_RANGE) +
      TIMING.EXPLODED_TIME_BASE;

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
        uOpacity: { value: RENDERING.INITIAL_OPACITY },
        uPointSize: { value: RENDERING.INITIAL_POINT_SIZE },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#points.position.set = this.#position;
    this.#scene.add(this.#points);

    // positions配列の参照をキャッシュ
    this.#positionsArray = positions;
  }

  /** 毎フレーム更新処理（上昇→爆発→減衰→消滅の状態管理） */
  public update(): void {
    if (!this.#points || !this.#geometry) return;

    if (!this.#isExploded) {
      this.#upAge++;
      this.#points.position.y = this.#upAge;

      if (this.#upAge > this.#upTime) {
        this.#explode();
      }
    } else {
      // 爆発後の粒子の挙動
      this.#explodedTimeAge++;

      if (this.#material) {
        this.#material.uniforms.uOpacity.value =
          1.0 - this.#explodedTimeAge / this.#explodedTime;
        this.#material.uniforms.uPointSize.value =
          PARTICLE.POINT_SIZE -
          (this.#explodedTimeAge / this.#explodedTime) * PARTICLE.POINT_SIZE;
      }

      // パーティクルの位置を速度ベクトルで更新（最適化版）
      if (!this.#positionsArray) return;

      // 重力値を定数として事前計算
      const gravity = PHYSICS.GRAVITY;

      // キャッシュされた配列を使用してメモリアクセスを最適化
      let idx = 0;
      for (let i = 0; i < this.#particleCount; i++) {
        const velocity = this.#particleVelocities[i];

        // 重力の影響を速度に加える
        velocity.y += gravity;

        // 位置更新（インデックス計算を最小化）
        this.#positionsArray[idx++] += velocity.x;
        this.#positionsArray[idx++] += velocity.y;
        this.#positionsArray[idx++] += velocity.z;
      }
      this.#geometry!.attributes.position.needsUpdate = true;

      if (this.#explodedTimeAge > this.#explodedTime) {
        this.#dispose();
      }
    }
  }

  /** 爆発処理（粒子生成・速度ベクトルの付与など） */
  #explode(): void {
    this.#isExploded = true;

    if (this.#material) {
      this.#material.uniforms.uOpacity.value = RENDERING.INITIAL_OPACITY; // 爆発時に一瞬明るく
      this.#material.uniforms.uPointSize.value = RENDERING.INITIAL_POINT_SIZE;
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

      direction
        .normalize()
        .multiplyScalar(
          Math.random() * PHYSICS.PARTICLE_VELOCITY_RANGE +
            PHYSICS.PARTICLE_VELOCITY_MIN
        );
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

  /** 爆発状態の取得 */
  public get isExploded(): boolean {
    return this.#isExploded;
  }

  /** 爆発してからの経過時間の取得 */
  public get explodedProgress(): number {
    return this.#isExploded ? this.#explodedTimeAge / this.#explodedTime : 0;
  }
}
