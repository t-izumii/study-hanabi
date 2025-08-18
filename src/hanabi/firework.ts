import * as THREE from "three";

export class Firework {
  #scene: THREE.Scene;
  #position: THREE.Vector3;
  #velocity: THREE.Vector3;
  #color: THREE.Color;
  #particleCount: number;
  #launchParticleCount: number;
  #lifespan: number;
  #isFinishedFrag: boolean;
  #state: "launching" | "exploded";
  #age: number;
  #points: THREE.Points | null;
  #particleVelocities: THREE.Vector3[];

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
    this.#position = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      0.0,
      (Math.random() - 0.5) * 20
    );
    this.#velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01, // x方向ランダム
      0.0,
      (Math.random() - 0.5) * 0.01 // z方向ランダム
    );

    // HSLベースでランダムな色を生成
    const hue = Math.random(); // 0-1の範囲でhueをランダム化
    const saturation = 0.8 + (Math.random() - 0.5) * 0.4; // 0.6-1.0の範囲
    const lightness = 0.6 + (Math.random() - 0.5) * 0.4; // 0.4-0.8の範囲
    this.#color = new THREE.Color().setHSL(hue, saturation, lightness);
    this.#launchParticleCount = 10; // 打ち上げ時は少数の粒子
    this.#particleCount = this.#launchParticleCount; // 初期は打ち上げ用
    this.#lifespan = Math.floor(Math.random() * 100) + 100;

    this.#isFinishedFrag = false;
    this.#state = "launching";
    this.#age = 0;
    this.#points = null;
    this.#particleVelocities = [];
    this.#velocity.y = 1.0; // 上昇速度を設定
    this.create();
  }

  create(): void {
    const positions = new Float32Array(this.#particleCount * 3);
    const indices = new Float32Array(this.#particleCount);

    for (let i = 0; i < this.#particleCount; i++) {
      // 打ち上げ時は軌跡のように少しずつ後ろに配置
      const trailOffset = i * 1.0; // 軌跡の間隔を広げる
      const spread = 0.05; // 初期の散らばり
      positions[i * 3 + 0] = this.#position.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = this.#position.y - trailOffset + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = this.#position.z + (Math.random() - 0.5) * spread;

      // 粒子のインデックスを設定
      indices[i] = i;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "particleIndex",
      new THREE.BufferAttribute(indices, 1)
    );
    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uColor: { value: this.#color },
        uSize: { value: 2.0 }, // 打ち上げ時は小さめ
        uAlpha: { value: 0.8 }, // 打ち上げ時は少し透明
        uIsLaunching: { value: 1.0 }, // 1.0 = 打ち上げ中, 0.0 = 爆発中
      },
      vertexShader: `
        uniform vec3 uColor;
        uniform float uSize;
        uniform float uIsLaunching;
        varying vec3 vColor;
        varying float vAlpha;
        attribute float particleIndex;
        void main() {
          vColor = uColor;
          // 打ち上げ時のみ軌跡の後ろほど透明に
          if (uIsLaunching > 0.5) {
            vAlpha = 1.0 - (particleIndex / 10.0) * 0.8;
          } else {
            vAlpha = 1.0; // 爆発時は全て同じ透明度
          }
          gl_PointSize = uSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uAlpha;
        void main() {
          // 円形の粒子を作成
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // 中心から端にかけてフェード
          float alpha = (1.0 - dist * 2.0) * uAlpha * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    this.#points = new THREE.Points(geometry, material);
    // 打ち上げ時はpointsオブジェクトの位置を原点に固定
    this.#points.position.set(0, 0, 0);
    this.#scene.add(this.#points);

    // 作成時は更新しない
  }

  //打ち上げ処理
  update(): void {
    if (this.#isFinishedFrag) return;

    this.#age++;

    if (this.#state === "launching") {
      // 上昇処理
      this.#position.add(this.#velocity);
      this.#velocity.y -= 0.02; // 重力

      if (this.#points) {
        // 軌跡エフェクト：各粒子を段階的に更新
        const positions = this.#points.geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = this.#particleCount - 1; i > 0; i--) {
          // 後の粒子を前の粒子の位置にコピー（軌跡効果）
          positions.array[i * 3 + 0] = positions.array[(i - 1) * 3 + 0];
          positions.array[i * 3 + 1] = positions.array[(i - 1) * 3 + 1];
          positions.array[i * 3 + 2] = positions.array[(i - 1) * 3 + 2];
        }

        // 先頭の粒子は正確な現在位置に（散らばりは視覚効果のみ）
        positions.array[0] = this.#position.x;
        positions.array[1] = this.#position.y;
        positions.array[2] = this.#position.z;

        positions.needsUpdate = true;
      }

      // 爆発条件（速度が0以下または一定時間経過）
      if (this.#velocity.y <= 0 || this.#age > 60) {
        this.#explode();
      }
    } else if (this.#state === "exploded") {
      // 爆発後の粒子更新
      if (this.#points && this.#particleVelocities.length > 0) {
        const positions = this.#points.geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < this.#particleCount; i++) {
          // 各粒子の位置を更新
          positions.array[i * 3 + 0] += this.#particleVelocities[i].x;
          positions.array[i * 3 + 1] += this.#particleVelocities[i].y;
          positions.array[i * 3 + 2] += this.#particleVelocities[i].z;

          // 重力を適用
          this.#particleVelocities[i].y -= 0.01;
        }

        positions.needsUpdate = true;

        // 寿命に応じてサイズと透明度を変更
        const lifeRatio = this.#age / this.#lifespan;
        const material = this.#points.material as THREE.ShaderMaterial;

        // 爆発直後は大きめ、寿命末期は小さめ
        const size = 12.0 * (1.0 - lifeRatio) + 3.0;
        material.uniforms.uSize.value = size;

        // 寿命末期で透明に
        const alpha = 1.0 - Math.pow(lifeRatio, 2);
        material.uniforms.uAlpha.value = alpha;
      }

      // 寿命チェック
      if (this.#age > this.#lifespan) {
        this.#dispose();
      }
    }
  }

  //爆発処理
  #explode(): void {
    this.#state = "exploded";
    this.#age = 0; // 爆発後の年齢をリセット

    // 爆発用に粒子数を増やす
    this.#particleCount = 1000;

    // 軌跡の先頭粒子の位置を爆発位置として使用
    let explodePosition = this.#position.clone();
    
    if (this.#points) {
      const positions = this.#points.geometry.getAttribute("position") as THREE.BufferAttribute;
      // 軌跡の先頭粒子（インデックス0）の位置を取得
      explodePosition.set(
        positions.array[0],
        positions.array[1], 
        positions.array[2]
      );
    }

    // 新しいジオメトリを作成
    if (this.#points) {
      // 古いジオメトリを削除
      this.#scene.remove(this.#points);
      this.#points.geometry.dispose();

      // 爆発用の新しいジオメトリを作成
      const positions = new Float32Array(this.#particleCount * 3);
      const indices = new Float32Array(this.#particleCount);

      for (let i = 0; i < this.#particleCount; i++) {
        positions[i * 3 + 0] = explodePosition.x;
        positions[i * 3 + 1] = explodePosition.y;
        positions[i * 3 + 2] = explodePosition.z;
        indices[i] = i;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "particleIndex",
        new THREE.BufferAttribute(indices, 1)
      );

      this.#points = new THREE.Points(geometry, this.#points.material);
      // 爆発時もpointsオブジェクトの位置を原点に固定
      this.#points.position.set(0, 0, 0);

      // 爆発モードに切り替え
      const material = this.#points.material as THREE.ShaderMaterial;
      material.uniforms.uIsLaunching.value = 0.0;

      this.#scene.add(this.#points);
    }

    // 各粒子にランダムな方向の速度を設定
    this.#particleVelocities = [];
    for (let i = 0; i < this.#particleCount; i++) {
      // 球面上のランダムな方向を生成
      const theta = Math.random() * Math.PI * 2; // 水平角度
      const phi = Math.acos(2 * Math.random() - 1); // 垂直角度（均等分布）

      const speed = Math.random() * 0.5 + 0.2; // 0.2~0.7の速度

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      this.#particleVelocities.push(velocity);
    }
  }

  /** 後始末処理（シーンから削除・リソース解放） */
  #dispose(): void {
    if (this.#points) {
      this.#scene.remove(this.#points);
      this.#points.geometry.dispose();
      (this.#points.material as THREE.Material).dispose();
      this.#points = null;
    }
    this.#isFinishedFrag = true;
  }

  /** 終了判定（外部から参照可能） */
  isFinished(): boolean {
    return this.#isFinishedFrag;
  }
}
