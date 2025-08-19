// 花火の物理設定
export const PHYSICS = {
  GRAVITY: -0.001,
  PARTICLE_VELOCITY_MIN: 0.1,
  PARTICLE_VELOCITY_RANGE: 0.02,
} as const;

// パーティクル設定
export const PARTICLE = {
  COUNT_BASE: 300,
  COUNT_RANGE: 80,
  POINT_SIZE: 3.0,
} as const;

// タイミング設定
export const TIMING = {
  UP_TIME_BASE: 80,
  UP_TIME_RANGE: 10,
  EXPLODED_TIME_BASE: 300,
  EXPLODED_TIME_RANGE: 10,
} as const;

// 位置設定
export const POSITION = {
  X_RANGE: 200,
  Y_START: -30.0,
  Z_RANGE: 100,
} as const;

// レンダリング設定
export const RENDERING = {
  INITIAL_OPACITY: 1.0,
  INITIAL_POINT_SIZE: 3.0,
} as const;