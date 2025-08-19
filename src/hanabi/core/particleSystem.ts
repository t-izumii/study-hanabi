/**
 * ParticleSystem - パーティクルの物理計算・動作を担当
 *
 * 【主な責務】
 * - パーティクルの位置・速度計算
 * - 物理シミュレーション（重力、抵抗など）
 * - 爆発パターンの生成（球状、リング状、しだれ柳など）
 * - パーティクルデータの管理
 *
 * 【具体的な処理】
 * 1. 初期位置の設定
 * 2. 爆発時の速度ベクトル生成（球面座標変換）
 * 3. 毎フレームの位置更新（速度 + 重力）
 * 4. Float32Array の最適化された更新処理
 * 5. 花火種類別の異なる爆発パターン実装
 */

import * as THREE from "three";
import { PHYSICS, PARTICLE, TIMING, POSITION } from "../constants";
import { FireworkState } from "../types";
import { FireworkRenderer } from "./FireworkRenderer";
import { ResourceManager } from "./ResourceManager";

export class ParticleSystem {
  #color: THREE.Color;
  #particleCount: number;
  #position: THREE.Vector3;

  #scene: THREE.Scene;
  #state: FireworkState;
  #renderer: FireworkRenderer;
  #positionsArray: Float32Array | null = null;

  #upAge: number = 0;
  #upTime: number;
  #explodedTimeAge: number = 0;
  #explodedTime: number;

  #particleVelocities: THREE.Vector3[] = [];

  #isDisposed: boolean = false;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3 = new THREE.Vector3(
      (Math.random() - 0.5) * POSITION.X_RANGE,
      POSITION.Y_START,
      (Math.random() - 0.5) * POSITION.Z_RANGE
    )
  ) {
    this.#scene = scene;
    this.#state = FireworkState.RISING;
    this.#color = new THREE.Color(Math.random(), Math.random(), Math.random());
    this.#particleCount =
      Math.floor(Math.random() * PARTICLE.COUNT_RANGE) + PARTICLE.COUNT_BASE;
    this.#position = position;

    this.#upTime =
      Math.floor(Math.random() * TIMING.UP_TIME_RANGE) + TIMING.UP_TIME_BASE;
    this.#explodedTime =
      Math.floor(Math.random() * TIMING.EXPLODED_TIME_RANGE) +
      TIMING.EXPLODED_TIME_BASE;

    // FireworkRendererを初期化
    this.#renderer = new FireworkRenderer(scene, this.#color);

    this.#init();
  }

  #init(): void {
    this.#create();
  }

  #create(): void {
    const positions = new Float32Array(this.#particleCount * 3);
    for (let i = 0; i < this.#particleCount; i++) {
      positions[i * 3 + 0] = this.#position.x;
      positions[i * 3 + 1] = this.#position.y;
      positions[i * 3 + 2] = this.#position.z;
    }

    // positions配列の参照をキャッシュ
    this.#positionsArray = positions;

    // FireworkRendererを使用してレンダリングオブジェクトを作成
    const points = this.#renderer.createRenderObjects(positions);
    points.position.set(this.#position.x, this.#position.y, this.#position.z);
  }

  update(): void {
    if (this.#isDisposed) return;
    switch (this.#state) {
      case FireworkState.RISING:
        // 上昇処理
        this.#upAge++;
        const points = this.#renderer.points;
        if (points) {
          points.position.y = this.#upAge;
        }

        if (this.#upAge > this.#upTime) {
          this.#explode();
          this.#state = FireworkState.EXPLODED;
        }
        break;

      case FireworkState.EXPLODED:
        // 爆発処理
        this.#explodedTimeAge++;

        // FireworkRendererで視覚効果を更新
        const progress = this.#explodedTimeAge / this.#explodedTime;
        this.#renderer.updateVisualEffects(progress);

        if (!this.#positionsArray) break;
        const gravity = PHYSICS.GRAVITY;

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

        // ジオメトリの更新通知
        const geometry = this.#renderer.geometry;
        if (geometry?.attributes.position) {
          geometry.attributes.position.needsUpdate = true;
        }

        if (this.#explodedTimeAge > this.#explodedTime) {
          this.#state = FireworkState.FINISHED;
        }
        break;

      case FireworkState.FINISHED:
        this.#dispose();
        this.#isDisposed = true;
        break;
    }
  }

  #explode(): void {
    // 拡散処理
    if (this.#state === FireworkState.RISING) {
      // FireworkRendererで爆発効果をトリガー
      this.#renderer.triggerExplosionEffect();

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
  }

  #dispose(): void {
    // ResourceManagerを使用してリソースを安全に廃棄
    ResourceManager.disposePoints(this.#renderer.points, this.#scene);

    // FireworkRenderer自体も廃棄
    this.#renderer.dispose();

    // 配列参照をクリア
    if (this.#positionsArray) {
      ResourceManager.clearArrayReferences([this.#positionsArray]);
      this.#positionsArray = null;
    }
  }

  public get isFinished(): boolean {
    return this.#isDisposed;
  }

  public get state(): FireworkState {
    return this.#state;
  }

  public get explodedTimeAge(): number {
    return this.#explodedTimeAge;
  }

  public get explodedTime(): number {
    return this.#explodedTime;
  }
}
