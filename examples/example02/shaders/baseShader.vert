attribute vec4 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vNormal = normal;
    vUv = uv;
}