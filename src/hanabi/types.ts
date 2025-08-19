import * as THREE from "three";

// 花火のステータス
export const FireworkState = {
  RISING: "rising", // 打ち上げ中
  EXPLODED: "exploded", // 爆発処理
  FINISHED: "finished", // 完了
} as const;

export type FireworkState = typeof FireworkState[keyof typeof FireworkState];

// uniforms
export interface FireworkUniforms {
  [uniform: string]: THREE.IUniform<any>;
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
  uPointSize: { value: number };
}

// 定数用
export interface FireworkConfig {
  particleCount: number;
  upTime: number;
  explodedTime: number;
  position: THREE.Vector3;
  color: THREE.Color;
}
