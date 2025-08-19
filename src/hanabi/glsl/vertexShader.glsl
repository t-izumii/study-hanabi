uniform vec3 uColor;
uniform float uPointSize;
varying vec3 vColor;

void main() {
  vColor = uColor;
  gl_PointSize = uPointSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}