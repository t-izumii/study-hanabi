import * as THREE from "three";
import { Firework } from "./firework";
import { FIREWORK_PROBABILITY } from "./settings";

export default function Hanabi() {
  console.log(THREE);
  console.log(Firework);
  console.log(FIREWORK_PROBABILITY);

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
  camera.position.z = 100;

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
    opacity: 0.1,
    depthWrite: false,
  });
  const fadePlane = new THREE.Mesh(fadeGeometry, fadeMaterial);
  fadePlane.position.z = -0.1;
  scene.add(fadePlane);

  //
  // 花火配列の初期化
  // -------------
  const fireworks: Firework[] = [];

  const firework = new Firework(scene);
  console.log(firework);

  function animate() {
    requestAnimationFrame(animate);

    // 手動で画面をクリア
    renderer.clear();
    
    // 残像効果用の背景を最初に描画
    fadePlane.visible = true;
    renderer.render(scene, camera);
    
    // 残像背景を隠して花火だけを描画
    fadePlane.visible = false;
    firework.update();
    renderer.render(scene, camera);
  }

  animate();
}
