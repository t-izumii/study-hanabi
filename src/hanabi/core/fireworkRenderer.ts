/**
 * FireworkRenderer - 花火のレンダリング処理を担当
 * 
 * 【主な責務】
 * - シェーダーマテリアルの作成・管理
 * - Three.js の Points オブジェクト生成
 * - レンダリング設定（ブレンディング、透明度など）
 * - 視覚効果の制御（色、サイズ、透明度の変化）
 * 
 * 【具体的な処理】
 * 1. 頂点・フラグメントシェーダーの設定
 * 2. uniforms の管理（色、透明度、ポイントサイズ）
 * 3. BufferGeometry と Points の生成
 * 4. シーンへの追加・削除
 * 5. 毎フレームの視覚的更新（フェードアウトなど）
 */

import * as THREE from "three";
import { RENDERING, PARTICLE } from "../constants";
import { FireworkUniforms } from "../types";
import fragmentShader from "../glsl/fragmentShader.glsl";
import vertexShader from "../glsl/vertexShader.glsl";

export class FireworkRenderer {
  #scene: THREE.Scene;
  #points: THREE.Points | null = null;
  #geometry: THREE.BufferGeometry | null = null;
  #material: THREE.ShaderMaterial | null = null;
  #uniforms: FireworkUniforms;

  constructor(scene: THREE.Scene, color: THREE.Color) {
    this.#scene = scene;
    this.#uniforms = {
      uColor: { value: color },
      uOpacity: { value: RENDERING.INITIAL_OPACITY },
      uPointSize: { value: RENDERING.INITIAL_POINT_SIZE },
    };
  }

  /**
   * レンダリングオブジェクトの作成
   */
  createRenderObjects(positions: Float32Array): THREE.Points {
    // BufferGeometry作成
    this.#geometry = new THREE.BufferGeometry();
    this.#geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    // ShaderMaterial作成
    this.#material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: this.#uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    // Points作成
    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#scene.add(this.#points);

    return this.#points;
  }

  /**
   * 視覚効果の更新（透明度・サイズ）
   */
  updateVisualEffects(progress: number): void {
    if (!this.#material) return;

    // フェードアウト効果
    this.#material.uniforms.uOpacity.value = 1.0 - progress;
    
    // サイズ縮小効果
    this.#material.uniforms.uPointSize.value = 
      PARTICLE.POINT_SIZE - (progress * PARTICLE.POINT_SIZE);
  }

  /**
   * 爆発時の視覚効果（一瞬明るく）
   */
  triggerExplosionEffect(): void {
    if (!this.#material) return;
    
    this.#material.uniforms.uOpacity.value = RENDERING.INITIAL_OPACITY;
    this.#material.uniforms.uPointSize.value = RENDERING.INITIAL_POINT_SIZE;
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    if (this.#points) {
      this.#scene.remove(this.#points);
      this.#points = null;
    }
    
    this.#geometry?.dispose();
    this.#geometry = null;
    
    this.#material?.dispose();
    this.#material = null;
  }

  /**
   * レンダリング状態の取得
   */
  public get isReady(): boolean {
    return this.#points !== null && this.#geometry !== null && this.#material !== null;
  }

  public get points(): THREE.Points | null {
    return this.#points;
  }

  public get geometry(): THREE.BufferGeometry | null {
    return this.#geometry;
  }
}
