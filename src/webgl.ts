import * as THREE from "three";
import { Firework } from "./hanabi";
import { FIREWORK_PROBABILITY } from "./hanabi/settings";
import { bgPlane } from "./background";

export default function webgl() {
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
  const background = new bgPlane(scene);

  //
  // cameraの初期化
  // -------------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false; // 自動クリアを無効化
  document.body.appendChild(renderer.domElement);

  //
  // 花火配列の初期化
  // -------------
  const fireworks: Firework[] = [];

  // クリックで花火を作成
  window.addEventListener("click", () => {
    const firework = new Firework(scene);
    fireworks.push(firework);
  });

  function animate() {
    requestAnimationFrame(animate);

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
        const explosionIntensity = 0.3 * (1 - progress); // 爆発直後が最も明るく、徐々に暗くなる
        totalIntensity += explosionIntensity;
      }
    }

    directionalLight.intensity +=
      (totalIntensity - directionalLight.intensity) * 0.1;

    renderer.render(scene, camera);
  }

  animate();
}
