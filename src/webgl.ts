import * as THREE from "three";
import { Firework } from "./hanabi";
import { FIREWORK_PROBABILITY } from "./hanabi/settings";

export default function webgl() {

  //
  // sceneの初期化
  // -------------
  const scene = new THREE.Scene();

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
  // 残像効果用の半透明背景
  // -------------
  const fadeGeometry = new THREE.PlaneGeometry(2, 2);
  const fadeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.01, // さらに弱いフェード効果で非常に長い残像
    depthWrite: false,
  });
  const fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial);
  fadePlane.position.z = -0.1;
  scene.add(fadePlane);

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

    // 手動で画面をクリア
    renderer.clear();

    // 残像効果用の背景を最初に描画
    fadePlane.visible = true;
    renderer.render(scene, camera);

    // 残像背景を隠して花火だけを描画
    fadePlane.visible = false;

    // 全ての花火を更新
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      if (fireworks[i].isFinished) {
        fireworks.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  animate();
}
