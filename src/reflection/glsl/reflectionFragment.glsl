uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uTextureOffset;
uniform vec2 uTextureScale;

varying vec2 vUv;

void main() {
  // UVを正規化されたピクセル座標に変換
  vec2 coord = vUv;

  coord = (coord - 0.5) * uTextureScale + 0.5 + uTextureOffset;

  coord.y = 1.0 - coord.y;

  float wave = sin(coord.x * 10.0 + uTime * 2.0) * 0.01;
  coord.y += wave;

  float fadeGradient = smoothstep(0.0, 1.0, vUv.y);

  vec4 texColor = texture2D(uTexture, coord);

  texColor.rgb *= 0.6; // 少し暗くする
  texColor.a *= uOpacity * (1.0 - fadeGradient * 0.8); // グラデーションでフェード

  gl_FragColor = texColor;
}