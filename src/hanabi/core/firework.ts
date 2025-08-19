import * as THREE from "three";
import { ParticleSystem } from "./ParticleSystem";
import { FireworkState } from "../types";

/**
 * Firework - 花火全体の統合管理クラス
 * 
 * 【主な責務】
 * - ParticleSystemの管理
 * - 外部APIの提供
 * - ライフサイクル管理
 * - 状態の統合管理
 */
export class Firework {
  #particleSystem: ParticleSystem;

  constructor(
    scene: THREE.Scene,
    position?: THREE.Vector3
  ) {
    this.#particleSystem = new ParticleSystem(scene, position);
  }

  /**
   * 毎フレーム更新処理
   */
  public update(): void {
    this.#particleSystem.update();
  }

  /**
   * 花火の終了判定
   */
  public get isFinished(): boolean {
    return this.#particleSystem.isFinished;
  }

  /**
   * 花火の現在状態
   */
  public get state(): FireworkState {
    return this.#particleSystem.state;
  }

  /**
   * 爆発状態の判定
   */
  public get isExploded(): boolean {
    return this.#particleSystem.state === FireworkState.EXPLODED;
  }

  /**
   * 爆発してからの進捗率（0.0 - 1.0）
   */
  public get explodedProgress(): number {
    if (this.#particleSystem.state !== FireworkState.EXPLODED) {
      return 0;
    }
    return this.#particleSystem.explodedTimeAge / this.#particleSystem.explodedTime;
  }

  /**
   * 手動廃棄（通常は自動的に廃棄される）
   */
  public dispose(): void {
    // ParticleSystemが内部的にリソース廃棄を行う
    // 必要に応じて追加の後始末処理をここに記述
  }
}
