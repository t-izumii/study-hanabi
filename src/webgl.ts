import * as THREE from "three";
import { Firework } from "./hanabi";
import { BgPlane } from "./background";
import { Reflection } from "./reflection";

export default function webgl() {
  const view = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  //
  // sceneの初期化
  // -------------
  const scene = new THREE.Scene();

  //
  // ライティングの初期化
  // -------------
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
  directionalLight.position.set(1, 1, 0.5);
  scene.add(directionalLight);

  //
  // 背景プレーンの初期化
  // -------------
  new BgPlane(scene);

  // リフレクションは後で初期化（テクスチャが必要）
  let reflection: Reflection;

  //
  // cameraの初期化
  // -------------
  const camera = new THREE.PerspectiveCamera(
    75,
    view.width / view.height,
    0.1,
    1000
  );
  camera.position.z = 200;

  //
  // rendererの初期化
  // -------------
  const renderer = new THREE.WebGLRenderer({
    alpha: false,
  });
  renderer.setSize(view.width, view.height);
  renderer.autoClear = false; // 自動クリアを無効化
  document.body.appendChild(renderer.domElement);

  //
  // リフレクション用レンダーターゲットの初期化
  // -------------
  const reflectionRenderTarget = new THREE.WebGLRenderTarget(
    view.width,
    view.height,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    }
  );

  //
  // 花火配列の初期化
  // -------------
  const fireworks: Firework[] = [];

  // クリックで花火を作成
  window.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const firework = new Firework(scene);
    fireworks.push(firework);
  });

  window.addEventListener("resize", () => {
    view.width = window.innerWidth;
    view.height = window.innerHeight;

    // カメラのアスペクト比を更新
    camera.aspect = view.width / view.height;
    camera.updateProjectionMatrix();

    // レンダラーのサイズを更新
    renderer.setSize(view.width, view.height);

    // リフレクション用レンダーターゲットのサイズを更新
    reflectionRenderTarget.setSize(view.width, view.height);
  });

  function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001; // 秒単位の時間

    // 全ての花火を更新
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      if (fireworks[i].isFinished) {
        fireworks.splice(i, 1);
      }
    }

    // 花火の状態に応じてライトの強度を変更（線形補間）
    const baseIntensity = 0.1;
    let totalIntensity = baseIntensity;

    for (const firework of fireworks) {
      if (!firework.isExploded) {
        // 打ち上げ中: 軽く明るくする
        totalIntensity += 0.05;
      } else {
        // 爆発中: 爆発の進行度に応じて明るさを変化
        const progress = firework.explodedProgress;
        const explosionIntensity = 1 - progress; // 爆発直後が最も明るく、徐々に暗くなる
        totalIntensity += explosionIntensity * 0.3;
      }
    }

    directionalLight.intensity +=
      (totalIntensity - directionalLight.intensity) * 0.1;

    // 花火シーンをリフレクション用テクスチャにレンダリング
    // リフレクションオブジェクトを一時的に非表示にして花火だけレンダリング
    if (reflection && reflection.mesh) {
      reflection.mesh.visible = false;
    }

    // カメラを反転させてリフレクション効果を作成
    const originalY = camera.position.y;
    camera.position.y = -camera.position.y;
    camera.lookAt(0, 0, 0);

    renderer.setRenderTarget(reflectionRenderTarget);
    renderer.clear(); // 前のフレームをクリア
    renderer.render(scene, camera);

    // カメラ位置を元に戻す
    camera.position.y = originalY;
    camera.lookAt(0, 0, 0);

    // リフレクションが初期化されていない場合は初期化
    if (!reflection) {
      reflection = new Reflection(scene, reflectionRenderTarget.texture);
      reflection.setTextureOffset(0, -0.2);
      reflection.setTextureScale(0.8, 0.8);
    }

    // リフレクションの時間を更新（波のアニメーション用）
    reflection.updateTime(time);

    // リフレクションオブジェクトを再表示
    if (reflection.mesh) {
      reflection.mesh.visible = true;
    }

    // Step 2: 通常のシーンレンダリング
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  animate();
}
